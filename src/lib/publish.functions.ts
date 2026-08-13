import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Generate a unique serial ID matching the existing format: MUSA-XXXXXX-XXXX
function generateSerialId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random4 = Array.from(
    { length: 4 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
  return `MUSA-${stamp}-${random4}`;
}

// We create a server-side Supabase client factory
function getServerSupabase(token?: string) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }

  if (!token) {
    return createClient(url, key);
  }

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function isSchemaCacheColumnError(error: { code?: string; message?: string; details?: string }, column: string) {
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    error.code === "42703" ||
    text.includes(`'${column.toLowerCase()}' column`) ||
    text.includes(`\"${column.toLowerCase()}\" column`) ||
    text.includes(column.toLowerCase())
  );
}

function isOptionalVendorColumnError(error: { code?: string; message?: string; details?: string }) {
  return ["business_name", "full_name", "phone"].some((column) =>
    isSchemaCacheColumnError(error, column),
  );
}

const publishSchema = z.object({
  shopName: z.string().min(1),
  ownerName: z.string().min(1),
  phone: z.string().optional(),
  productName: z.string().min(1),
  productPrice: z.string(),
  productCategory: z.string(),
  productDesc: z.string(),
  turnstileToken: z.string().optional(),
  flagged_for_review: z.boolean().optional(),
  access_token: z.string(),
  user_id: z.string().min(1),
  productType: z.enum(["produto", "servico"]),
  media_urls: z.array(z.string()).optional(),
});

export const publishItemFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => publishSchema.parse(input))
  .handler(async ({ data }) => {
    // 1. Validar Turnstile (fail-open — não bloqueia se falhar)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && data.turnstileToken && data.turnstileToken.length > 0) {
      try {
        const body = new URLSearchParams({
          secret: turnstileSecret,
          response: data.turnstileToken,
        });
        const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          body,
        });
        const result = (await verify.json()) as { success: boolean };
        if (!result.success) {
          // Fail-open: registar aviso mas NÃO bloquear a publicação
          console.warn("[PUBLISH] Turnstile falhou — a continuar em modo fail-open:", result);
        }
      } catch (e) {
        console.warn("[PUBLISH] Erro de rede no Turnstile — a continuar:", e);
      }
    }

    const supabase = getServerSupabase(data.access_token);

    // 2. Obter ou Criar Vendor Subscription
    let vendorId = null;
    const { data: existingVendor, error: checkVendorError } = await supabase
      .from("vendor_subscriptions")
      .select("id")
      .eq("user_id", data.user_id)
      .maybeSingle();

    if (checkVendorError) {
      console.error("[PUBLISH] Erro ao verificar loja existente:", checkVendorError);
      return {
        success: false,
        error: `Falha na Base de Dados ao procurar a loja: ${checkVendorError.message}`,
      };
    }

    if (existingVendor) {
      vendorId = existingVendor.id;
    } else {
      console.log("[PUBLISH] Loja não encontrada, a criar nova subscrição...");
      let newVendor = null;
      let vendorError = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const serial_id = generateSerialId();
        const baseVendorPayload = {
          serial_id,
          user_id: data.user_id,
          plan: "basic",
          status: "active",
        };
        const phone = data.phone?.trim();
        const vendorPayloads = [
          {
            ...baseVendorPayload,
            business_name: data.shopName,
            full_name: data.ownerName,
            ...(phone ? { phone } : {}),
          },
          {
            ...baseVendorPayload,
            full_name: data.ownerName,
          },
          {
            ...baseVendorPayload,
            business_name: data.shopName,
          },
          {
            ...baseVendorPayload,
          },
        ];

        for (const vendorPayload of vendorPayloads) {
          const res = await supabase
            .from("vendor_subscriptions")
            .insert(vendorPayload)
            .select("id")
            .maybeSingle();

          if (!res.error) {
            newVendor = res.data;
            vendorError = null;
            break;
          }

          if (res.error.code === "23505") {
            vendorError = res.error;
            break;
          }

          if (!isOptionalVendorColumnError(res.error)) {
            vendorError = res.error;
            break;
          }

          vendorError = res.error;
        }

        if (newVendor) break;
        if (vendorError?.code !== "23505") break;
      }

      if (vendorError || !newVendor) {
        console.error("[PUBLISH] Erro final ao criar loja:", vendorError);
        return {
          success: false,
          error: `Não foi possível criar a loja: ${vendorError?.message || "Erro Desconhecido"}`,
        };
      }
      vendorId = newVendor.id;
    }

    // 3. Verificar Limite de 5 publicações por dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [productsCountRes, servicesCountRes] = await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", vendorId)
        .gte("created_at", todayIso),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", vendorId)
        .gte("created_at", todayIso),
    ]);

    if (productsCountRes.error) {
      console.error("[PUBLISH] Erro ao contar produtos:", productsCountRes.error);
      return {
        success: false,
        error: `Falha ao verificar limites de publicação: ${productsCountRes.error.message}`,
      };
    }
    if (servicesCountRes.error) {
      console.error("[PUBLISH] Erro ao contar serviços:", servicesCountRes.error);
      return {
        success: false,
        error: `Falha ao verificar limites de publicação: ${servicesCountRes.error.message}`,
      };
    }

    const totalToday = (productsCountRes.count || 0) + (servicesCountRes.count || 0);

    if (totalToday >= 5) {
      console.warn("[PUBLISH] Limite diário atingido para vendor:", vendorId);
      return { success: false, error: "Atingiste o limite diário de 5 publicações." };
    }

    // 4. Inserir Produto ou Serviço
    const table = data.productType === "produto" ? "products" : "services";
    const payload = {
      name: data.productName,
      description: data.productDesc,
      price: parseFloat(data.productPrice) || null,
      category: data.productCategory,
      vendor_id: vendorId,
      flagged_for_review: data.flagged_for_review || false,
      media_urls: data.media_urls || [],
    };

    const { error: insertError } = await supabase.from(table).insert(payload);

    if (insertError) {
      console.error(`[PUBLISH] Erro ao inserir na tabela ${table}:`, insertError);
      return {
        success: false,
        error: `Falha ao guardar na Base de Dados (${table}): ${insertError.message}`,
      };
    }

    console.log(`[PUBLISH] Sucesso! Item inserido na tabela ${table} para vendor ${vendorId}`);
    return { success: true };
  });
