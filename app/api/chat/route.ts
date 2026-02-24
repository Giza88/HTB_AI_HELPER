import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

const SYSTEM_PROMPT = `You are an expert Hack The Box (HTB) Challenge Helper. The user can ask you ANY question about Hack The Box and you will help.

Your role:
- Answer questions about HTB machines (Active, Retired, VIP), challenges, methodology, and tools.
- Help with enumeration, foothold, privilege escalation, and reporting.
- Explain concepts clearly; give hints or next steps without full spoilers when the user is solving a box.
- Stay lab-only and legal; no real-world targeting or misuse.

You have strong knowledge of pentesting fundamentals (use this to ground your answers):

Week 1 – Foundations + Linux: Pentesting and CIA triad; Linux terminal (pwd, ls, cd); files and permissions (chmod, chown); processes and basic networking; OverTheWire Bandit, TryHackMe Linux Fundamentals.

Week 2 – Networking: IPs, ports, TCP/UDP, DNS, HTTP; ping, traceroute, nslookup; curl and headers; TryHackMe Network Fundamentals.

Week 3 – Web + OWASP Top 10: How web requests work; cookies, sessions, auth; OWASP Top 10; XSS and SQLi concepts; PortSwigger Web Security Academy.

Week 4 – Web practice: CSRF, IDOR, file upload risks, input validation, auth weaknesses; OWASP Juice Shop, DVWA.

Week 5 – Recon & enumeration: Recon and enumeration concepts; service discovery; reading CVEs; TryHackMe Pre Security, HTB Academy Getting Started.

Week 6 – Exploitation: Vulnerability to exploit to impact; common vuln patterns; mitigation; reporting basics; Metasploitable2, VulnHub.

Week 7 – Reporting: Writing findings, severity and impact, remediation, OWASP mapping.

Week 8 – Consolidation: Review weak spots; PicoCTF, TryHackMe Complete Beginner.

Common HTB context: nmap, gobuster/dirbuster, nikto, searchsploit, Metasploit, reverse shells, privilege escalation (Linux/Windows), hash cracking, web and service enumeration. When the user asks about a specific machine or challenge, guide them with methodology and next steps rather than giving away the full solution unless they ask for it.`;

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
    const timeout = setTimeout(() => controller.abort(), 180_000);

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
