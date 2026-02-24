"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [model, setModel] = useState("llama3.1:8b");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [weekIndex, setWeekIndex] = useState(1);
  const [dayIndex, setDayIndex] = useState(1);
  const [notes, setNotes] = useState("");
  const [streamEnabled, setStreamEnabled] = useState(true);

  const recommendedModel = "llama3.1:8b";

  useEffect(() => {
    const savedModel = window.localStorage.getItem("ollama_model");
    const savedUrl = window.localStorage.getItem("ollama_url");
    const savedWeek = window.localStorage.getItem("study_week");
    const savedDay = window.localStorage.getItem("study_day");
    const savedNotes = window.localStorage.getItem("study_notes");
    const savedStream = window.localStorage.getItem("ollama_stream");

    if (savedModel) {
      setModel(savedModel);
      setSelectedModel(savedModel);
    }

    if (savedUrl) {
      setOllamaUrl(savedUrl);
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
    window.localStorage.setItem("ollama_model", model.trim());
  }, [model]);

  useEffect(() => {
    window.localStorage.setItem("ollama_url", ollamaUrl.trim());
  }, [ollamaUrl]);

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
    window.localStorage.setItem("ollama_stream", String(streamEnabled));
  }, [streamEnabled]);

  useEffect(() => {
    if (!selectedModel) {
      setSelectedModel(model);
    }
  }, [model, selectedModel]);

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
          ollamaUrl: ollamaUrl.trim(),
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
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (!last || last.role !== "assistant") return prev;
                  updated[updated.length - 1] = {
                    ...last,
                    content: assistantContent,
                  };
                  return updated;
                });
              }
              if (chunk.done) {
                break;
              }
            } catch {
              continue;
            }
          }
        }
      } else {
        const data = (await response.json()) as { message?: string };
        const reply = data.message?.trim() || "(No response)";
        setMessages([...nextMessages, { role: "assistant", content: reply }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      const lower = message.toLowerCase();
      if (lower.includes("connection") || lower.includes("refused")) {
        setErrorHint("Ollama may be offline. Start it and try again.");
      } else if (lower.includes("model") || lower.includes("not found")) {
        setErrorHint("Model not found. Run: ollama pull <model>.");
      } else if (lower.includes("aborted")) {
        setErrorHint("The request took too long (timeout). Try again — the first response can be slow on weaker hardware.");
      } else {
        setErrorHint(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyAutoModel = (models: string[]) => {
    if (models.length === 0) return;

    const preferred =
      models.find((item) => item === recommendedModel) ?? models[0];

    if (!models.includes(model)) {
      setModel(preferred);
      setSelectedModel(preferred);
    } else if (!selectedModel) {
      setSelectedModel(model);
    }
  };

  const testConnection = async () => {
    if (isTestingConnection) return;
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const response = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaUrl: ollamaUrl.trim() }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Connection failed");
      }

      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };
      const models = data.models?.map((item) => item.name) ?? [];
      setAvailableModels(models);
      applyAutoModel(models);
      setConnectionStatus(
        models.length > 0
          ? `Connected. Found ${models.length} model(s).`
          : "Connected. No models found."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setConnectionStatus(message);
      setAvailableModels([]);
    } finally {
      setIsTestingConnection(false);
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
      <main className="flex min-h-screen w-full max-w-6xl flex-col gap-6 py-16 px-6">
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
                    {message.content}
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

          <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about Hack The Box..."
                className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={isLoading}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-black"
              >
                {isLoading ? "Thinking..." : "Send"}
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-100">
              Model & Connection
              </h2>
              <p className="mt-2">
              Recommended: <span className="font-semibold">llama3.1:8b</span>.
              Lower-end hardware can try{" "}
              <span className="font-semibold">qwen2.5:7b</span>.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
              Chat requires Ollama running (e.g. <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">ollama serve</code>) and a model (e.g. <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">ollama pull llama3.1:8b</code>). Use Test Connection to verify.
              </p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Ollama URL
              </label>
              <input
                value={ollamaUrl}
                onChange={(event) => setOllamaUrl(event.target.value)}
                placeholder="http://localhost:11434"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100"
              />
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Model
              </label>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="llama3.1:8b"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100"
              />
                {availableModels.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Installed Models
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100"
                    >
                      {availableModels.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedModel) {
                          setModel(selectedModel);
                        }
                      }}
                      className="w-fit rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Use selected model
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={isTestingConnection}
                    className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                  >
                    {isTestingConnection ? "Testing..." : "Test Connection"}
                  </button>
                  <span className="text-xs text-zinc-500">
                    Changes save automatically.
                  </span>
                </div>
                {connectionStatus && (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {connectionStatus}
                  </div>
                )}
                {availableModels.length > 0 && (
                  <div className="text-xs text-zinc-500">
                    Installed models: {availableModels.join(", ")}
                  </div>
                )}
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
