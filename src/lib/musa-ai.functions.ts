import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(1800),
  context: z
    .object({
      route: z.string().optional(),
      userRole: z.enum(["guest", "creator"]).optional(),
      preferredCategories: z.array(z.string()).optional(),
      businessType: z.string().optional(),
      salesData: z.record(z.any()).optional(),
    })
    .optional(),
});

const responseSchema = z.object({
  reply: z.string(),
  allowed: z.boolean(),
});

function isGibberish(message: string) {
  const text = message.trim();
  if (text.length < 4) return true;

  const alnum = (text.match(/[a-z0-9À-ÿ]/gi) || []).length;
  const symbolCount = (text.match(/[^a-z0-9À-ÿ\s]/gi) || []).length;
  if (alnum === 0) return true;
  if (symbolCount > alnum) return true;

  const words = text
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9À-ÿ]/gi, ""))
    .filter(Boolean);
  if (words.length === 0) return true;

  const repeatedChars = /(.)\1{5,}/i.test(text);
  const lowVariety = new Set(text.toLowerCase().replace(/\s+/g, "").split("")).size <= 2;
  return repeatedChars || lowVariety;
}

// If messaging/topic filter is desired, implement heuristics here.
// For now allow all non-gibberish messages through to the assistant.
function isOnPlatformTopic(_message: string) {
  return true;
}

function refusalMessage() {
  return "Sou a Musa AI. Ajudo com lojas, produtos, serviços, criadoras e conselhos de negócio na plataforma. Como posso ajudar-te hoje?";
}

// Strict moderation detector (simple keyword-based). If a message touches
// disallowed themes (violence, sex, self-harm, hate), the assistant must
// refuse with the exact safe-response below.
function detectForbiddenContent(message: string) {
  const text = message.toLowerCase();
  const forbidden = [
    // sexual
    "sexo",
    "porn",
    "porno",
    "nude",
    "nudes",
    "erot",
    // self-harm / suicide
    "suicid",
    "auto?mutil",
    "cortar",
    // violence
    "matar",
    "assassin",
    "morte",
    "arma",
    // hate / slurs
    "racista",
    "racismo",
    "ódio",
    "odio",
  ];

  return forbidden.some((kw) => text.includes(kw));
}

export const musaAssistantFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => chatSchema.parse(input))
  .handler(async ({ data }) => {
    if (isGibberish(data.message) || !isOnPlatformTopic(data.message)) {
      return {
        allowed: false,
        reply: refusalMessage(),
      };
    }

    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env["VITE_GROQ_API_KEY"] ||
      process.env["VITE_OPENAI_API_KEY"];

    const systemPrompt = `És a Musa AI, a assistente virtual premium do marketplace angolano MUSA. O teu tom é educado, elegante e altamente profissional.

PRINCIPAIS DIRETIVAS:

1) ANÁLISE INICIAL
- Antes de responder, interpreta o contexto do utilizador (papel, categorias preferidas, rota atual) e adapta a resposta.

2) GUIA DA PLATAFORMA MUSA
- Explica funcionalidades (publicar, gerir perfil, checkout WhatsApp, etc.) de forma passo-a-passo quando relevante.

3) ASSISTENTE DE NEGÓCIOS
- Dá recomendações estratégicas (preço, foto, descrição, promoções) orientadas ao mercado angolano.

4) ESTILO DE COMUNICAÇÃO
- Responde em Português (pt-AO/pt-PT neutro), com linguagem sofisticada mas acessível.
- Usa títulos, listas, negrito e, quando adequado, tabelas Markdown para apresentar dados.

REGRA ESTRITA DE MODERAÇÃO:
- É proibido gerar conteúdo com insultos, ódio, automutilação, violência ou sexo.
- Se o utilizador abordar esses temas, responde APENAS com exatamente:
  'Desculpe, não posso ajudar com esse tipo de assunto. Como posso auxiliar a impulsionar a sua loja hoje?'

OUTRAS REGRAS:
- Se a mensagem for gibberish/ruído, recusa e pede clarificação.
- Se não souber a resposta, admite e sugere passos práticos na MUSA.
- Formata respostas com Markdown (tabelas, listas, negrito) para melhor leitura.

ENTREGA: devolve apenas o texto da resposta do assistente em Markdown.`;

    if (!apiKey) {
      return {
        allowed: true,
        reply: refusalMessage(),
      };
    }

    // Server-side moderation: reject forbidden topics before calling external API
    if (detectForbiddenContent(data.message)) {
      return {
        allowed: false,
        reply: "Desculpe, não posso ajudar com esse tipo de assunto. Como posso auxiliar a impulsionar a sua loja hoje?",
      };
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(9000),
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Contexto: ${JSON.stringify(data.context ?? {})}\nMensagem: ${data.message}`,
            },
          ],
          temperature: 0.35,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const json = await response.json();
      const reply = String(json.choices?.[0]?.message?.content || "").trim();
      const parsed = responseSchema.safeParse({
        reply: reply || refusalMessage(),
        allowed: true,
      });

      if (!parsed.success) {
        return {
          allowed: true,
          reply: refusalMessage(),
        };
      }

      return parsed.data;
    } catch (error) {
      console.error("Musa AI error:", error);
      return {
        allowed: true,
        reply: refusalMessage(),
      };
    }
  });
