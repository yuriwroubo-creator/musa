import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// We create a server-side Supabase client factory
function getServerSupabase(token?: string) {
  const url = process.env.VITE_SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || "";
  
  if (!token) {
    // If no token, we can use the service role for admin tasks, but it's better to use anon
    return createClient(url, key);
  }
  
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const publishSchema = z.object({
  shopName: z.string().min(1),
  ownerName: z.string().min(1),
  phone: z.string().min(1),
  productName: z.string().min(1),
  productPrice: z.string(),
  productCategory: z.string(),
  productDesc: z.string(),
  turnstileToken: z.string().min(1).optional(),
  flagged_for_review: z.boolean().optional(),
  access_token: z.string(),
  user_id: z.string(),
  productType: z.enum(["produto", "servico"]),
});

export const publishItemFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => publishSchema.parse(input))
  .handler(async ({ data }) => {
    // 1. Validar Turnstile
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && data.turnstileToken) {
      const body = new URLSearchParams({
        secret: turnstileSecret,
        response: data.turnstileToken,
      });
      const verify = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body },
      );
      const result = await verify.json() as { success: boolean };
      if (!result.success) {
        return { success: false, error: "Falha na validação de segurança (Turnstile)." };
      }
    }

    const supabase = getServerSupabase(data.access_token);

    // 2. Obter ou Criar Vendor Subscription
    let vendorId = null;
    const { data: existingVendor } = await supabase
      .from("vendor_subscriptions")
      .select("id")
      .eq("user_id", data.user_id)
      .single();

    if (existingVendor) {
      vendorId = existingVendor.id;
    } else {
      // Create new vendor
      const { data: newVendor, error: vendorError } = await supabase
        .from("vendor_subscriptions")
        .insert({
          user_id: data.user_id,
          business_name: data.shopName,
          full_name: data.ownerName,
          phone: data.phone,
          status: "active",
        })
        .select("id")
        .single();
      
      if (vendorError || !newVendor) {
        console.error("Erro ao criar vendor:", vendorError);
        return { success: false, error: "Não foi possível registar a loja." };
      }
      vendorId = newVendor.id;
    }

    // 3. Verificar Limite de 5 publicações por dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [productsCountRes, servicesCountRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).gte("created_at", todayIso),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).gte("created_at", todayIso),
    ]);

    const totalToday = (productsCountRes.count || 0) + (servicesCountRes.count || 0);

    if (totalToday >= 5) {
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
    };

    const { error: insertError } = await supabase.from(table).insert(payload);

    if (insertError) {
      console.error("Erro ao inserir:", insertError);
      return { success: false, error: "Não foi possível publicar o item." };
    }

    return { success: true };
  });
