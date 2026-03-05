"use client";

import type { ReactNode } from "react";
import { Fragment, useEffect, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Formats raw AI text for clean, readable display. Preserves code blocks; adds structure for headings, lists, and paragraphs. */
function formatAiMessage(content: string): ReactNode {
  if (!content || !content.trim()) return content;

  const elements: ReactNode[] = [];
  const codeBlockRegex = /```[\s\S]*?```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <Fragment key={`text-before-${match.index}`}>
          {parseTextBlocks(content.slice(lastIndex, match.index))}
        </Fragment>
      );
    }
    const codeRaw = match[0];
    const langMatch = codeRaw.match(/^```(\w*)\n?/);
    const codeContent = langMatch ? codeRaw.slice(langMatch[0].length, -3) : codeRaw.slice(3, -3);
    elements.push(
      <pre key={match.index} className="my-3 overflow-x-auto rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-xs dark:border-zinc-600 dark:bg-zinc-800">
        <code className="whitespace-pre">{codeContent}</code>
      </pre>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    elements.push(
      <Fragment key="text-tail">
        {parseTextBlocks(content.slice(lastIndex))}
      </Fragment>
    );
  }

  return <div className="space-y-2 whitespace-pre-wrap break-words">{elements}</div>;
}

function parseTextBlocks(text: string): ReactNode {
  const lines = text.split(/\n/);
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${i}`} className="mt-4 text-base font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100">
          {trimmed.slice(3)}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${i}`} className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {trimmed.slice(4)}
        </h3>
      );
      i++;
      continue;
    }
    if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      const listStart = i;
      const listItems: string[] = [];
      while (i < lines.length) {
        const ln = lines[i];
        const t = ln.trim();
        if (/^[-•*]\s/.test(t) || /^\d+\.\s/.test(t)) {
          listItems.push(t.replace(/^[-•*]\s/, "").replace(/^\d+\.\s/, ""));
          i++;
        } else if (/^\s{2,}/.test(ln) && listItems.length > 0) {
          listItems[listItems.length - 1] += "\n" + ln.trim();
          i++;
        } else if (!t) {
          i++;
          break;
        } else {
          break;
        }
      }
      blocks.push(
        <ul key={`ul-${listStart}`} className="list-inside list-disc space-y-1 pl-2 text-zinc-700 dark:text-zinc-300">
          {listItems.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (trimmed) {
      const paraLines: string[] = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith("#") && !/^[-•*]\s/.test(lines[i].trim()) && !/^\d+\.\s/.test(lines[i].trim())) {
        paraLines.push(lines[i].trim());
        i++;
      }
      blocks.push(
        <div key={`p-${i}`} className="space-y-1">
          {paraLines.map((line, k) => (
            <p key={k} className="leading-relaxed text-zinc-700 dark:text-zinc-300">
              {line}
            </p>
          ))}
        </div>
      );
      continue;
    }
    i++;
  }

  return <>{blocks}</>;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [model, setModel] = useState("gemini-2.5-flash");
  const [weekIndex, setWeekIndex] = useState(1);
  const [dayIndex, setDayIndex] = useState(1);
  const [notes, setNotes] = useState("");
  const [streamEnabled, setStreamEnabled] = useState(true);

  useEffect(() => {
    const savedModel = window.localStorage.getItem("gemini_model");
    const savedWeek = window.localStorage.getItem("study_week");
    const savedDay = window.localStorage.getItem("study_day");
    const savedNotes = window.localStorage.getItem("study_notes");
    const savedStream = window.localStorage.getItem("stream_enabled");

    if (savedModel) {
      const m = savedModel.trim();
      const deprecated = ["gemini-2.0-flash", "gemini-1.5-flash"];
      if (deprecated.includes(m)) {
        window.localStorage.setItem("gemini_model", "gemini-2.5-flash");
        setModel("gemini-2.5-flash");
      } else {
        setModel(m);
      }
    }

    if (savedWeek) {
      const parsed = Number(savedWeek);
      if (!Number.isNaN(parsed)) {
        setWeekIndex(parsed);
      }
    }

    if (savedDay) {
      const parsed = Number(savedDay);
      if (!Number.isNaN(parsed)) {
        setDayIndex(parsed);
      }
    }

    if (savedNotes) {
      setNotes(savedNotes);
    }

    if (savedStream) {
      setStreamEnabled(savedStream === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gemini_model", model.trim());
  }, [model]);

  useEffect(() => {
    window.localStorage.setItem("study_week", String(weekIndex));
  }, [weekIndex]);

  useEffect(() => {
    window.localStorage.setItem("study_day", String(dayIndex));
  }, [dayIndex]);

  useEffect(() => {
    window.localStorage.setItem("study_notes", notes);
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem("stream_enabled", String(streamEnabled));
  }, [streamEnabled]);

  const dailySession = [
    {
      title: "5 min",
      detail: "Review yesterday's notes or key terms.",
    },
    {
      title: "15 min",
      detail: "New concept explained in beginner-friendly steps.",
    },
    {
      title: "8 min",
      detail: "Hands-on lab or guided walkthrough.",
    },
    {
      title: "2 min",
      detail: "Write a 3-bullet recap and next question.",
    },
  ];

  const studyPlan = [
    {
      week: 1,
      focus: "Foundations + Linux",
      days: [
        "What pentesting is + CIA triad",
        "Linux terminal basics (pwd, ls, cd)",
        "Files & permissions (chmod, chown)",
        "Processes + basic networking",
        "Review + mini quiz",
        "OverTheWire Bandit (0-3)",
        "TryHackMe: Linux Fundamentals 1",
      ],
      labs: ["OverTheWire Bandit", "TryHackMe Linux Fundamentals"],
    },
    {
      week: 2,
      focus: "Networking Basics",
      days: [
        "IPs, ports, TCP/UDP",
        "DNS + HTTP overview",
        "ping / traceroute / nslookup",
        "curl and reading headers",
        "Review + mini quiz",
        "TryHackMe: Network Fundamentals",
        "PicoCTF networking intro",
      ],
      labs: ["TryHackMe Network Fundamentals", "PicoCTF"],
    },
    {
      week: 3,
      focus: "Web Basics + OWASP Top 10",
      days: [
        "How web requests work",
        "Cookies, sessions, auth",
        "OWASP Top 10 overview",
        "XSS concept",
        "SQLi concept",
        "PortSwigger: XSS intro",
        "PortSwigger: SQLi intro",
      ],
      labs: ["PortSwigger Web Security Academy"],
    },
    {
      week: 4,
      focus: "Web Practice",
      days: [
        "CSRF + IDOR concepts",
        "File upload risks",
        "Input validation basics",
        "Auth weaknesses",
        "Review + mini quiz",
        "OWASP Juice Shop (beginner tasks)",
        "DVWA (low difficulty)",
      ],
      labs: ["OWASP Juice Shop", "DVWA"],
    },
    {
      week: 5,
      focus: "Recon & Enumeration (Lab-only)",
      days: [
        "Recon concepts",
        "Enumeration concepts",
        "Service discovery theory",
        "Reading CVEs",
        "Review + mini quiz",
        "TryHackMe: Pre Security",
        "HTB Academy: Getting Started",
      ],
      labs: ["TryHackMe", "Hack The Box Academy"],
    },
    {
      week: 6,
      focus: "Exploitation Basics",
      days: [
        "Vuln → exploit → impact",
        "Common vuln patterns",
        "Mitigation mindset",
        "Reporting basics",
        "Review + mini quiz",
        "Metasploitable2 (local VM)",
        "VulnHub beginner box",
      ],
      labs: ["Metasploitable2", "VulnHub"],
    },
    {
      week: 7,
      focus: "Reporting & Documentation",
      days: [
        "How to write findings",
        "Severity & impact",
        "Remediation write-ups",
        "OWASP Top 10 mapping",
        "Review + mini quiz",
        "Report: Juice Shop",
        "Report: DVWA",
      ],
      labs: ["Write reports from labs"],
    },
    {
      week: 8,
      focus: "Consolidation + CTF Practice",
      days: [
        "Review weak spots",
        "Review weak spots",
        "Review weak spots",
        "Review weak spots",
        "Review weak spots",
        "PicoCTF beginner set",
        "TryHackMe Complete Beginner",
      ],
      labs: ["PicoCTF", "TryHackMe"],
    },
  ];

  const quickPrompts = [
    "How do I start an HTB machine? What's the methodology?",
    "Explain enumeration for a Linux box (nmap, services, dirs).",
    "Common web vulnerabilities I should check on HTB.",
    "What's the difference between Active and Retired machines?",
    "Give me hints for privilege escalation on Linux.",
  ];

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    if (streamEnabled) {
      setMessages([...nextMessages, { role: "assistant", content: "" }]);
    } else {
      setMessages(nextMessages);
    }
    setInput("");
    setIsLoading(true);
    setError(null);
    setErrorHint(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          model: model.trim(),
          stream: streamEnabled,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errMessage = text;
        try {
          const errJson = JSON.parse(text) as { error?: string };
          if (typeof errJson.error === "string") errMessage = errJson.error;
        } catch {
          // keep text as-is
        }
        throw new Error(errMessage);
      }

      if (streamEnabled) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Streaming response unavailable");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            try {
              const chunk = JSON.parse(trimmedLine) as {
                message?: { content?: string };
                response?: string;
                done?: boolean;
              };
              const content =
                chunk.message?.content ??
                (typeof chunk.response === "string" ? chunk.response : "");
              if (content) {
                assistantContent += content;
              }
              if (chunk.done) break;
            } catch {
              continue;
            }
          }
        }

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: assistantContent };
          } else {
            updated.push({ role: "assistant", content: assistantContent });
          }
          return updated;
        });
      } else {
        const data = (await response.json()) as { message?: string };
        const reply = data.message?.trim() || "(No response)";
        setMessages([...nextMessages, { role: "assistant", content: reply }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      const lower = message.toLowerCase();
      if (lower.includes("gemini_api_key") || lower.includes("not configured")) {
        setErrorHint("Add GEMINI_API_KEY to .env.local. Get a key at aistudio.google.com/apikey");
      } else if (lower.includes("rate limit") || lower.includes("quota") || lower.includes("429")) {
        setErrorHint("Free tier limit reached. Wait a few minutes, or try gemini-2.5-flash-lite. Check usage at aistudio.google.com");
      } else if (lower.includes("aborted")) {
        setErrorHint("The request took too long (timeout). Try again.");
      } else {
        setErrorHint(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayPlan = () => {
    const currentWeek = studyPlan.find((item) => item.week === weekIndex);
    if (!currentWeek) {
      return {
        week: weekIndex,
        day: dayIndex,
        focus: "Unknown",
        topic: "Plan not found",
        labs: [],
      };
    }

    const topic = currentWeek.days[dayIndex - 1] ?? currentWeek.days[0];
    return {
      week: currentWeek.week,
      day: dayIndex,
      focus: currentWeek.focus,
      topic,
      labs: currentWeek.labs,
    };
  };

  const generateTodaysPrompt = () => {
    const today = getTodayPlan();
    setInput(
      `Today's session: Week ${today.week}, Day ${today.day} (${today.focus}). Topic: ${today.topic}. Please teach this in a 30-minute beginner lesson with a quick lab and recap.`
    );
  };

  const advanceProgress = () => {
    if (dayIndex < 7) {
      setDayIndex(dayIndex + 1);
      return;
    }

    if (weekIndex < 8) {
      setWeekIndex(weekIndex + 1);
      setDayIndex(1);
      return;
    }
  };

  const resetProgress = () => {
    setWeekIndex(1);
    setDayIndex(1);
  };

  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notes);
    } catch {
      setError("Copy failed. Select the notes and copy manually.");
    }
  };

  const downloadNotes = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "study-notes.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black"
      style={{
        backgroundImage: "url(/icon.png)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center top",
        backgroundSize: "420px",
      }}
    >
      {/* Fixed bottom bar – Copilot-style chat input, always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] flex h-14 w-full items-center border-t border-zinc-700/40 bg-zinc-900 px-4 dark:border-zinc-700/50 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about Hack The Box — machines, challenges, tools, methodology..."
            className="flex-1 rounded-lg border border-zinc-600/50 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading}
            className="shrink-0 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>

      <main className="flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 pb-24 pt-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="HTB Helper logo"
              className="h-10 w-10 rounded-xl"
            />
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              HTB Challenge Helper
            </h1>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Ask anything about Hack The Box — machines, challenges, tools, and methodology.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="flex min-h-[520px] flex-1 flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  Ask anything about Hack The Box — machines, challenges, tools, or methodology.
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-md px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "self-end bg-black text-white dark:bg-zinc-100 dark:text-black"
                        : "self-start bg-zinc-100 text-black dark:bg-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    {message.role === "assistant"
                      ? formatAiMessage(message.content)
                      : message.content}
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                <div>{error}</div>
                {errorHint && <div className="mt-2 text-xs">{errorHint}</div>}
              </div>
            )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={streamEnabled}
                onChange={(event) => setStreamEnabled(event.target.checked)}
                className="h-3 w-3 rounded border border-zinc-300 text-black focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-950"
              />
              Streaming
            </label>
          </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-100">
                Gemini Model
              </h2>
              <p className="mt-2 text-xs text-zinc-500">
                Uses <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">GEMINI_API_KEY</code> from .env.local. Get a key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">aistudio.google.com/apikey</a>.
              </p>
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Model
                </label>
                <input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="gemini-2.5-flash"
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Examples: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-pro. Saves automatically.
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-100">
                Progress Tracker
              </h2>
              <div className="mt-3 text-xs text-zinc-500">
                Week {weekIndex} · Day {dayIndex}
              </div>
              <div className="mt-2 text-sm font-semibold text-black dark:text-zinc-100">
                {getTodayPlan().focus}
              </div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {getTodayPlan().topic}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Labs: {getTodayPlan().labs.join(", ")}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={generateTodaysPrompt}
                  className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                >
                  Generate today&apos;s session
                </button>
                <button
                  type="button"
                  onClick={advanceProgress}
                  className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                >
                  Mark day complete
                </button>
                <button
                  type="button"
                  onClick={resetProgress}
                  className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
                >
                  Reset
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-100">
                Session Notes
              </h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Write your notes here..."
                rows={6}
                className="mt-3 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyNotes}
                  className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                >
                  Copy notes
                </button>
                <button
                  type="button"
                  onClick={downloadNotes}
                  className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                >
                  Download .txt
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-100">
                Daily 30-Minute Format
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {dailySession.map((item) => (
                  <div key={item.title} className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-800">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-100">
                Pentesting basics (what this helper knows)
              </h2>
              <div className="mt-3 flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-2">
                {studyPlan.map((week) => (
                  <div key={week.week} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Week {week.week}
                    </div>
                    <div className="text-sm font-semibold text-black dark:text-zinc-100">
                      {week.focus}
                    </div>
                    <ul className="mt-2 list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-400">
                      {week.days.map((day, index) => (
                        <li key={`${week.week}-${day}-${index}`}>{day}</li>
                      ))}
                    </ul>
                    <div className="mt-2 text-xs text-zinc-500">
                      Labs: {week.labs.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
