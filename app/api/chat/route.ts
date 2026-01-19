import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
const SYSTEM_PROMPT = `You are a beginner-friendly cybersecurity tutor.
Focus on clear explanations, safe lab practice, and fundamentals.
Provide step-by-step learning guidance and short exercises.
Avoid real-world targeting or misuse; stick to legal training labs only.`;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages?: ChatMessage[];
      model?: string;
      ollamaUrl?: string;
      stream?: boolean;
    };
    const messages = body.messages ?? [];
    const model = body.model?.trim() || OLLAMA_MODEL;
    const ollamaUrl = body.ollamaUrl?.trim() || OLLAMA_URL;
    const stream = Boolean(body.stream);

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages must be a non-empty array" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const safeMessages =
      messages[0]?.role === "system"
        ? messages
        : [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: safeMessages,
        stream,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Ollama error: ${text}` },
        { status: response.status }
      );
    }

    if (stream) {
      const bodyStream = response.body;
      if (!bodyStream) {
        return NextResponse.json(
          { error: "Ollama stream unavailable" },
          { status: 500 }
        );
      }

      const streamResponse = new ReadableStream({
        async start(controller) {
          const reader = bodyStream.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(decoder.decode(value));
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
        },
      });
    }

    const data = (await response.json()) as {
      message?: { role: "assistant"; content: string };
    };

    return NextResponse.json({
      message: data.message?.content ?? "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
