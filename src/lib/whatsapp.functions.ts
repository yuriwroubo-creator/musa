import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(6).max(30),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(160),
        quantity: z.number().int().min(1).max(999),
        price: z.number().min(0).optional(),
      }),
    )
    .min(1)
    .max(50),
  total: z.number().min(0).optional(),
  note: z.string().max(500).optional(),
  turnstileToken: z.string().min(1).optional(),
});

function buildMessage(order: z.infer<typeof orderSchema>) {
  const lines = [
    "*Novo pedido — Musa*",
    `Cliente: ${order.customerName}`,
    `Contacto: ${order.customerPhone}`,
    "",
    "*Itens:*",
    ...order.items.map(
      (i) => `• ${i.quantity}x ${i.name}${i.price != null ? ` — ${i.price}` : ""}`,
    ),
  ];
  if (order.total != null) lines.push("", `*Total:* ${order.total}`);
  if (order.note) lines.push("", `Nota: ${order.note}`);
  return lines.join("\n");
}

/** Envia o resumo do pedido por WhatsApp (UltraMsg) para o número admin. */
export const sendOrderToAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    const instanceId =
      process.env["ULTRAMSG_INSTANCE_ID"] || process.env["VITE_ULTRAMSG_INSTANCE_ID"];
    const token = process.env["ULTRAMSG_TOKEN"] || process.env["VITE_ULTRAMSG_TOKEN"];
    const admin =
      process.env["WHATSAPP_ADMIN_NUMBER"] || process.env["VITE_WHATSAPP_ADMIN_NUMBER"];
    if (!instanceId || !token || !admin) {
      return { sent: false, error: "ultramsg_not_configured" as const };
    }

    // Anti-spam: valida o Turnstile quando configurado.
    const turnstileSecret = process.env["TURNSTILE_SECRET_KEY"];
    if (turnstileSecret) {
      if (!data.turnstileToken) return { sent: false, error: "turnstile_missing" as const };
      
      const body = new URLSearchParams({
        secret: turnstileSecret,
        response: data.turnstileToken,
      });
      const verify = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body },
      );
      const result = (await verify.json()) as { success: boolean };
      if (!result.success) return { sent: false, error: "turnstile_failed" as const };
    }

    const payload = new URLSearchParams({
      token,
      to: admin.startsWith("+") ? admin : `+${admin}`,
      body: buildMessage(data),
    });

    const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });

    if (!res.ok) {
      console.error("UltraMsg falhou", res.status, await res.text());
      return { sent: false, error: "ultramsg_request_failed" as const };
    }

    return { sent: true, error: null };
  });

const vendorMessageSchema = z.object({
  shopName: z.string().min(1),
  ownerName: z.string().min(1),
  phone: z.string().min(1),
  productName: z.string().min(1),
  productPrice: z.string(),
  productCategory: z.string(),
  productDesc: z.string(),
  code: z.string(),
  turnstileToken: z.string().min(1).optional(),
  flagged_for_review: z.boolean().optional(),
});

/** Envia o pedido de publicação de produto/serviço por WhatsApp (UltraMsg). */
export const sendVendorPublishRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => vendorMessageSchema.parse(input))
  .handler(async ({ data }) => {
    const instanceId =
      process.env["ULTRAMSG_INSTANCE_ID"] || process.env["VITE_ULTRAMSG_INSTANCE_ID"];
    const token = process.env["ULTRAMSG_TOKEN"] || process.env["VITE_ULTRAMSG_TOKEN"];
    const admin =
      process.env["WHATSAPP_ADMIN_NUMBER"] || process.env["VITE_WHATSAPP_ADMIN_NUMBER"];
    if (!instanceId || !token || !admin) {
      return { sent: false, error: "ultramsg_not_configured" as const };
    }

    // Anti-spam: valida o Turnstile quando configurado.
    const turnstileSecret = process.env["TURNSTILE_SECRET_KEY"];
    if (turnstileSecret) {
      if (!data.turnstileToken) return { sent: false, error: "turnstile_missing" as const };
      
      const body = new URLSearchParams({
        secret: turnstileSecret,
        response: data.turnstileToken,
      });
      const verify = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body },
      );
      const result = (await verify.json()) as { success: boolean };
      if (!result.success) return { sent: false, error: "turnstile_failed" as const };
    }

    const message = `Olá MUSA! 👋 Quero publicar na plataforma.

Loja: ${data.shopName}
Titular: ${data.ownerName}
Telefone: ${data.phone}

Produto/Serviço: ${data.productName}
Preço: ${data.productPrice} AOA
Categoria: ${data.productCategory}
Descricao: ${data.productDesc}

Codigo: ${data.code}

${data.flagged_for_review ? '⚠️ ALERTA: Esta submissão requer revisão manual atenta. A moderação de segurança da IA falhou ou considerou o conteúdo ambíguo.' : ''}`;

    const payload = new URLSearchParams({
      token,
      to: admin.startsWith("+") ? admin : `+${admin}`,
      body: message,
    });

    const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });

    if (!res.ok) {
      console.error("UltraMsg falhou", res.status, await res.text());
      return { sent: false, error: "ultramsg_request_failed" as const };
    }

    return { sent: true, error: null };
  });