import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerVendor, type VendorRegistrationInput } from "@/lib/vendors";
import { verifyTurnstile } from "@/lib/turnstile.functions";

export interface VendorRegistrationPayload extends VendorRegistrationInput {
  /** Token gerado pelo widget Cloudflare Turnstile. */
  turnstileToken: string;
}

export function useVendorRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ turnstileToken, ...input }: VendorRegistrationPayload) => {
      const result = await verifyTurnstile({ data: { token: turnstileToken } });
      if (!result.success) {
        throw new Error("Verificação de segurança falhou. Tenta novamente.");
      }
      return registerVendor(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_subscriptions"] });
    },
  });
}