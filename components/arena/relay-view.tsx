"use client";

import { useRef, useState } from "react";
import { Play, Globe, Loader2, Check, X, GraduationCap, ArrowDown } from "lucide-react";
import type { TraceStep } from "@/lib/arena/types";
import { Panel } from "./ui";

type Attempt = {
  n: number;
  inheritedLessons: string[];
  steps: TraceStep[];
  status: "running" | "failed" | "success";
  reason?: string;
  learnedLesson?: string;
};

export function RelayView() {
  const [url, setUrl] = useState("");
  const [task, setTask] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(4);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const ref = useRef<Attempt[]>([]);

  const sync = () => setAttempts([...ref.current]);
  const patch = (n: number, fn: (a: Attempt) => Attempt) => {
    ref.current = ref.current.map((a) => (a.n === n ? fn(a) : a));
    sync();
  };

  async function run() {
    if (!url.trim() || !task.trim() || running) return;
    setRunning(true);
    setFatal(null);
    setStatus("Connecting…");
    ref.current = [];
    sync();
    try {
      const res = await fetch("/api/arena/relay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), task: task.trim(), maxAttempts }),
      });
      if (!res.ok || !res.body) throw new Error(`Server responded ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const c of chunks) {
          const line = c.split("\n").find((l) => l.startsWith("data: "));
          if (line) handle(JSON.parse(line.slice(6)));
        }
      }
    } catch (e) {
      setFatal((e as Error).message);
    } finally {
      ref.current = ref.current.map((a) =>
        a.status === "running" ? { ...a, status: "failed", reason: a.reason ?? "Run ended." } : a,
      );
      sync();
      setRunning(false);
    }
  }

  function handle(e: any) {
    switch (e.type) {
      case "status":
        setStatus(e.message);
        break;
      case "attempt-start":
        ref.current = [
          ...ref.current,
          { n: e.attempt, inheritedLessons: e.lessons ?? [], steps: [], status: "running" },
        ];
        sync();
        setStatus(`Attempt ${e.attempt} running…`);
        break;
      case "step":
        patch(e.attempt, (a) => ({ ...a, steps: [...a.steps, e.step] }));
        break;
      case "attempt-failed":
        patch(e.attempt, (a) => ({ ...a, status: "failed", reason: e.reason }));
        break;
      case "lesson":
        patch(e.attempt, (a) => ({ ...a, learnedLesson: e.lesson }));
        break;
      case "success":
        patch(e.attempt, (a) => ({ ...a, status: "success" }));
        setStatus("Solved.");
        break;
      case "exhausted":
        setStatus("Attempt budget exhausted.");
        break;
      case "error":
        setFatal(e.message);
        break;
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-arena-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Relay · Continual Learning</h1>
        <p className="mt-1 text-sm text-arena-muted">
          One best-effort agent attempts a real task. Every genuine failure becomes a lesson the next attempt
          inherits — watch it get smarter until it succeeds.
        </p>
      </header>

      <Panel className="p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-arena-muted">Website URL</span>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-arena-border bg-arena-panel2/50 px-3">
                <Globe size={15} className="text-arena-muted" />
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="saucedemo.com"
                  className="w-full bg-transparent py-2 text-sm outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-arena-muted">Task (pick one with a real gotcha)</span>
              <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={2}
                placeholder="Log in (standard_user / secret_sauce) and add the single cheapest product to the cart."
                className="mt-1 w-full resize-none rounded-lg border border-arena-border bg-arena-panel2/50 px-3 py-2 text-sm outline-none" />
            </label>
            <label className="flex items-center gap-2 text-xs text-arena-muted">
              Max attempts
              <input type="number" min={2} max={6} value={maxAttempts}
                onChange={(e) => setMaxAttempts(Math.max(2, Math.min(6, Number(e.target.value) || 4)))}
                className="w-16 rounded-lg border border-arena-border bg-arena-panel2/50 px-2 py-1 text-sm outline-none" />
            </label>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={running || !url.trim() || !task.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-arena-purple px-5 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(139,92,246,0.9)] disabled:opacity-50">
              {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              {running ? "Running…" : "Start Relay"}
            </button>
          </div>
        </div>
        {running && (
          <p className="mt-3 text-xs text-arena-purpleBright">
            <Loader2 size={12} className="mr-1 inline animate-spin" />
            {status} <span className="text-arena-muted">· live attempts take a few minutes; keep this tab open.</span>
          </p>
        )}
        {fatal && <p className="mt-3 text-xs text-arena-fail">{fatal}</p>}
      </Panel>

      {attempts.map((a) => (
        <div key={a.n}>
          <AttemptCard attempt={a} />
          {a.learnedLesson && (
            <div className="mx-auto flex max-w-md flex-col items-center py-2 text-center">
              <div className="rounded-lg border border-arena-neon/40 bg-arena-neon/5 px-3 py-2 text-xs text-arena-neon">
                <GraduationCap size={13} className="mr-1 inline" />
                Lesson learned: {a.learnedLesson}
              </div>
              <ArrowDown size={16} className="mt-1 text-arena-neonDim" />
              <span className="text-[10px] uppercase tracking-wide text-arena-muted">inherited by next attempt</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AttemptCard({ attempt: a }: { attempt: Attempt }) {
  const last = a.steps[a.steps.length - 1];
  const border =
    a.status === "success" ? "border-arena-neon/50" : a.status === "failed" ? "border-arena-fail/40" : "border-arena-border";
  return (
    <Panel className={`p-4 ${border} ${a.status === "success" ? "glow-neon" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">
          Attempt {a.n}
          {a.status === "running" && <Loader2 size={14} className="animate-spin text-arena-purpleBright" />}
          {a.status === "success" && <Check size={15} className="text-arena-neon" />}
          {a.status === "failed" && <X size={15} className="text-arena-fail" />}
        </span>
        <span className="text-xs text-arena-muted">{a.steps.length} actions</span>
      </div>

      {a.inheritedLessons.length > 0 && (
        <div className="mt-2 rounded-lg border border-arena-border bg-arena-panel2/40 p-2">
          <div className="text-[10px] uppercase tracking-wide text-arena-muted">Knows going in</div>
          <ul className="mt-1 space-y-0.5">
            {a.inheritedLessons.map((l, i) => (
              <li key={i} className="text-xs text-arena-text/80">• {l}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex gap-3">
        {last?.screenshot?.startsWith("data:") && (
          <img src={last.screenshot} alt="" className="h-28 w-44 shrink-0 rounded border border-arena-border object-cover object-top" />
        )}
        <ol className="max-h-36 flex-1 space-y-1 overflow-auto pr-1">
          {a.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-xs">
              <span className={s.ok ? "text-arena-neon" : "text-arena-fail"}>{s.ok ? "✓" : "✗"}</span>
              <span className="text-arena-muted">
                <span className="font-medium text-arena-text/80">{s.action}</span> {s.description}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {a.status === "failed" && a.reason && (
        <p className="mt-2 text-xs text-arena-fail">✗ {a.reason}</p>
      )}
      {a.status === "success" && (
        <p className="mt-2 text-xs text-arena-neon">✓ Task accomplished.</p>
      )}
    </Panel>
  );
}
