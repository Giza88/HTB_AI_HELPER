import { NextResponse } from "next/server";

const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { ollamaUrl?: string };
    const ollamaUrl = body.ollamaUrl?.trim() || DEFAULT_OLLAMA_URL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
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

    const data = (await response.json()) as {
      models?: Array<{ name: string }>;
    };

    return NextResponse.json({ models: data.models ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
