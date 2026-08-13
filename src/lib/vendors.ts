import { supabase } from "@/integrations/supabase/client";
import type { VendorSubscription } from "@/types/musa";

/** Gera um serial_id único no formato MUSA-XXXXXX-XXXX. */
export function generateSerialId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = (n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)))
      .map((v) => alphabet[v % alphabet.length])
      .join("");
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `MUSA-${stamp}-${random(4)}`;
}

export interface VendorRegistrationInput {
  full_name: string;
  phone: string;
  email?: string;
  business_name?: string;
  plan?: string;
}

/**
 * Regista uma vendedora em `vendor_subscriptions` com serial_id único.
 * Em caso de colisão do serial_id (unique violation) tenta novamente.
 */
export async function registerVendor(
  input: VendorRegistrationInput,
): Promise<VendorSubscription> {
  const { data: userData } = await supabase.auth.getUser();

  for (let attempt = 0; attempt < 5; attempt++) {
    const serial_id = generateSerialId();
    const { data, error } = await supabase
      .from("vendor_subscriptions")
      .insert({
        serial_id,
        user_id: userData.user?.id ?? null,
        full_name: input.full_name,
        phone: input.phone,
        email: input.email ?? userData.user?.email ?? null,
        business_name: input.business_name ?? null,
        plan: input.plan ?? "basic",
        status: "pending",
      })
      .select("*")
      .single();

    if (!error) return data as VendorSubscription;
    // 23505 = unique_violation -> novo serial e nova tentativa
    if (error.code !== "23505") throw error;
  }

  throw new Error("Não foi possível gerar um serial_id único. Tenta novamente.");
}