import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const checkContent = createServerFn({ method: "POST" })
  .validator(z.object({
    title: z.string(),
    description: z.string()
  }))
  .handler(async ({ data }) => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.warn("GROQ_API_KEY is missing. Passing moderation by default.");
      return { safe: true, flagged_for_review: true, error: "Missing API Key" };
    }

    const { title, description } = data;
    const prompt = `You are a strict automated content moderation AI for a marketplace.
Evaluate the following product/service listing and determine if it violates safety guidelines (pornography, hate speech, illegal activities, scams, extreme violence).

You MUST respond strictly with a valid JSON object matching this schema, and nothing else:
{
  "safe": boolean,
  "category": "none" | "pornography" | "hate" | "illegal" | "scam" | "violence"
}

Listing Title: ${title}
Listing Description: ${description}
`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        // We set a reasonable timeout (e.g. 5 seconds) so the UI doesn't hang forever
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(content || "{}");
        if (parsed.safe === false) {
          return { safe: false, category: parsed.category };
        }
        return { safe: true, flagged_for_review: false };
      } catch (e) {
        // Fallback: If JSON is malformed, we don't block the user, but we flag it for manual review
        return { safe: true, flagged_for_review: true, error: "JSON Parse Error" };
      }

    } catch (error) {
      console.error("Moderation AI error:", error);
      // Fail-safe: Network error, timeout, or rate-limit
      // Allow submission but flag it for manual review
      return { safe: true, flagged_for_review: true, error: (error as Error).message };
    }
  });
