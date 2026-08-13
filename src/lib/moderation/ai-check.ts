import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const moderationSchema = z.object({
  safe: z.boolean(),
  category: z.enum(["none", "pornography", "hate", "illegal", "scam", "violence"]).default("none"),
});

function localModerationFallback(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const rules: Array<{
    keywords: string[];
    category: z.infer<typeof moderationSchema>["category"];
  }> = [
    { keywords: ["porn", "nude", "sexo", "sex", "erótico", "erotico"], category: "pornography" },
    {
      keywords: ["ódio", "odio", "racista", "racismo", "hate", "nazism", "nazista"],
      category: "hate",
    },
    {
      keywords: ["arma", "cocaína", "cocaina", "drogas", "fraude", "golpe", "scam"],
      category: "scam",
    },
    {
      keywords: ["bomba", "matar", "assassin", "violence", "violência", "violencia"],
      category: "violence",
    },
    { keywords: ["ilegal", "fake", "pirata", "piracy", "contrabando"], category: "illegal" },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return { safe: false, category: rule.category };
    }
  }

  return { safe: true, category: "none" as const };
}

export const checkContent = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const groqKey = process.env.GROQ_API_KEY || process.env["VITE_GROQ_API_KEY"];
    if (!groqKey) {
      const fallback = localModerationFallback(data.title, data.description);
      return {
        ...fallback,
        flagged_for_review: true,
        error: "Missing API Key",
      };
    }

    const { title, description } = data;
    const systemPrompt = `You are a strict automated content moderation AI for a marketplace.
Evaluate the following product/service listing and determine if it violates safety guidelines (pornography, hate speech, illegal activities, scams, extreme violence).

You MUST respond strictly with a valid JSON object matching this schema, and nothing else:
{
  "safe": boolean,
  "category": "none" | "pornography" | "hate" | "illegal" | "scam" | "violence"
}`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        // We set a reasonable timeout (e.g. 5 seconds) so the UI doesn't hang forever
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Listing Title: ${title}\nListing Description: ${description}`,
            },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;

      const parsed = moderationSchema.safeParse(JSON.parse(content || "{}"));
      if (!parsed.success) {
        const fallback = localModerationFallback(title, description);
        return {
          ...fallback,
          flagged_for_review: true,
          error: "JSON Parse Error",
        };
      }

      if (!parsed.data.safe) {
        return { safe: false, category: parsed.data.category, flagged_for_review: false };
      }

      return { safe: true, flagged_for_review: false, category: parsed.data.category };
    } catch (error) {
      console.error("Moderation AI error:", error);
      const fallback = localModerationFallback(title, description);
      // Fail-safe: Network error, timeout, or rate-limit
      return {
        ...fallback,
        flagged_for_review: true,
        error: (error as Error).message,
      };
    }
  });
