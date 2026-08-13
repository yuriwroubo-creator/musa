import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1, "Token do Turnstile em falta"),
});

/**
 * Valida um token do Cloudflare Turnstile no servidor.
 * Requer o secret TURNSTILE_SECRET_KEY.
 */
export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const secret = process.env["TURNSTILE_SECRET_KEY"];
    if (!secret) {
      return { success: false, error: "turnstile_not_configured" as const };
    }

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", data.token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const json = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    return {
      success: Boolean(json.success),
      error: json.success ? null : (json["error-codes"]?.join(",") ?? "invalid_token"),
    };
  });