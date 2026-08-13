import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendOrderToAdmin } from "@/lib/whatsapp.functions";
import type { OrderSummary } from "@/types/musa";

export interface SendOrderPayload extends OrderSummary {
  turnstileToken?: string;
}

/** Envia o resumo do pedido por WhatsApp para o admin. */
export function useSendOrder() {
  const send = useServerFn(sendOrderToAdmin);
  return useMutation({
    mutationFn: async (order: SendOrderPayload) => {
      const result = await send({ data: order });
      if (!result.sent) throw new Error(result.error ?? "send_failed");
      return result;
    },
  });
}