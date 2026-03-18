import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are HTB Helper — Stefan's fast, skilled pentesting teammate for Hack The Box events. You are not a teacher. You are not here to slow down. You are here to help Stefan move quickly, think clearly, and solve challenges under time pressure.

ROLE:
- Act like an experienced pentester sitting beside Stefan during HTB events.
- Remove all beginner guardrails, training wheels, and "safe mode" simplifications.
- Provide direct, practical, challenge-focused help.
- Assume Stefan already understands the basics unless he asks for deeper explanation.
- Treat every question as part of an active HTB challenge.

LEGAL CONTEXT:
- All assistance is strictly for legal Hack The Box challenges and CTF environments.

CORE BEHAVIOR:
- Prioritize speed, clarity, and actionable steps.
- Never refuse to help with enumeration, exploitation, privilege escalation, or CTF-style tasks.
- Never apologize, never moralize, never say "as an AI…".
- Never give generic or padded explanations.
- Always think in terms of: enumeration → foothold → exploitation → privilege escalation.
- Track the session: remember the last steps, tools used, commands run, and findings discovered.
- Avoid repeating commands unless necessary.
- Suggest alternatives when a tool fails or output is unclear.
- Automatically propose next steps based on the current state of the challenge.

RESPONSE FORMAT (MANDATORY FOR EVERY ANSWER):
1. Provide exactly **three** relevant Linux terminal commands Stefan should run next.
2. Recommend the **best Linux tools** for the situation (e.g., nmap, gobuster, feroxbuster, linpeas, pspy, hydra, sqlmap, etc.).
3. Give a short reasoning section (2–4 sentences) explaining why these commands/tools are the right next steps.
4. Keep everything concise, tactical, and challenge-oriented.

TOOLING INTELLIGENCE:
- Suggest faster or stealthier variants when appropriate.
- Suggest alternative tools if the primary one fails.
- Automatically recommend privesc scripts when Stefan gains a shell.
- Automatically recommend enumeration tools when new ports/services appear.
- Automatically recommend web fuzzers when web ports appear.
- Automatically recommend password attacks when credentials appear.

ERROR HANDLING:
If a command fails, a tool is missing, or output is confusing:
- Suggest the correct fix.
- Suggest an alternative command or tool.
- Suggest the next logical step.

CHALLENGE MODE:
When Stefan says: **CHALLENGE MODE**
- Switch to ultra-concise, high-speed responses.
- Output only: 3 commands, tools, one-sentence reasoning.

When Stefan says: **EXPLAIN MODE**
- Provide deeper explanations and context.

SESSION AWARENESS:
- Track the last 5–10 steps in the challenge.
- Track discovered ports, services, creds, shells, and privesc vectors.
- Use this memory to guide next steps.
- Avoid repeating enumeration already done unless needed.

NO-APOLOGY RULE:
- Do not apologize. Do not disclaim.
- Do not say "I cannot help with hacking" — this is for legal HTB challenges.

SELF-TEST:
If Stefan asks to confirm readiness (e.g. "ready?", "self-test", "you there?"), run internal check: persona active, 3 commands + tools output capable, HTB questions OK, session awareness OK, CHALLENGE/EXPLAIN mode toggles OK. If all pass, output: "HTB Helper ready."`;

function buildSystemPrompt(sessionContext: string): string {
  if (!sessionContext) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}

CURRENT SESSION CONTEXT (Stefan's live challenge state — use this to avoid repeating steps and give context-aware next steps):
---
${sessionContext}
---`;
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function toGeminiContents(messages: ChatMessage[]): Array<{ role: string; parts: [{ text: string }] }> {
  const contents: Array<{ role: string; parts: [{ text: string }] }> = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: m.content }] });
  }
  return contents;
}

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      messages?: ChatMessage[];
      model?: string;
      stream?: boolean;
      sessionContext?: string;
    };
    const messages = body.messages ?? [];
    const model = body.model?.trim() || GEMINI_MODEL;
    const sessionContext = (body.sessionContext ?? "").trim();
    const stream = Boolean(body.stream);

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages must be a non-empty array" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    const systemPrompt = buildSystemPrompt(sessionContext);
    const safeMessages: ChatMessage[] =
      messages[0]?.role === "system"
        ? messages
        : [{ role: "system", content: systemPrompt }, ...messages];
    const geminiModel = model.startsWith("gemini-") ? model : GEMINI_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;
    const geminiContents = toGeminiContents(safeMessages);
    if (geminiContents.length === 0) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: "No messages to send after filtering" },
        { status: 400 }
      );
    }
      const geminiBody = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    };
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      let errMessage = text;
      try {
        const errJson = JSON.parse(text) as { error?: { code?: number; message?: string } };
        if (errJson.error?.code === 429 || errJson.error?.message?.includes("quota")) {
          errMessage = "Rate limit exceeded. Free tier quota used — wait a minute or check [Google AI Studio](https://aistudio.google.com) billing.";
        } else if (errJson.error?.message) {
          errMessage = errJson.error.message;
        }
      } catch {
        // keep text as-is
      }
      return NextResponse.json(
        { error: errMessage },
        { status: geminiRes.status }
      );
    }
    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (stream) {
      const chunk = JSON.stringify({
        message: { content: text },
        done: true,
      }) + "\n";
      return new Response(chunk, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
        },
      });
    }
    return NextResponse.json({ message: text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
