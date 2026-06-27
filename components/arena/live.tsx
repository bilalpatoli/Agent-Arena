"use client";

import { useRef, useState } from "react";
import { Play, Globe, Trophy, GitMerge, Loader2, Check, X, AlertTriangle, RotateCw } from "lucide-react";
import type { Run, TraceStep } from "@/lib/arena/types";
import { BTN_PRIMARY, Panel, SectionTitle, agentIcon } from "./ui";

type AgentStatus = "waiting" | "running" | "done" | "error" | "interrupted";

type AgentState = {
  id: string;
  name: string;
  status: AgentStatus;
  steps: TraceStep[];
  run?: Run;
  error?: string;
};

type PatchInfo = { sourceWinner: string; targets: string[]; behavior: string };

const SEED: AgentState[] = [
  { id: "speedrunner", name: "Speedrunner", status: "waiting", steps: [] },
  { id: "planner", name: "Planner", status: "waiting", steps: [] },
  { id: "verifier", name: "Verifier", status: "waiting", steps: [] },
];

// ── Visual state model ────────────────────────────────────────────────────────
type ViewState = "waiting" | "running" | "success" | "failed" | "interrupted";

function viewState(a: AgentState): ViewState {
  if (a.status === "running") return "running";
  if (a.status === "interrupted") return "interrupted";
  if (a.status === "error") return "failed";
  if (a.status === "done") return a.run?.result === "success" ? "success" : "failed";
  return "waiting";
}

const STATE_META: Record<ViewState, { label: string; text: string; border: string; dot: string }> = {
  waiting: { label: "Waiting for next agent", text: "text-arena-muted", border: "border-arena-border", dot: "bg-arena-muted" },
  running: { label: "Running", text: "text-arena-purpleBright", border: "border-arena-purpleBright/40", dot: "bg-arena-purpleBright" },
  success: { label: "Success", text: "text-arena-neon", border: "border-arena-neon/45", dot: "bg-arena-neon" },
  failed: { label: "Failed", text: "text-arena-red", border: "border-arena-red/45", dot: "bg-arena-red" },
  interrupted: { label: "Interrupted", text: "text-arena-amber", border: "border-arena-amber/45", dot: "bg-arena-amber" },
};

const mkStep = (steps: TraceStep[], action: string, description: string, ok: boolean): TraceStep => ({
  index: steps.length,
  action,
  description,
  ok,
});

export function LiveArena() {
  const [url, setUrl] = useState("");
  const [task, setTask] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [agents, setAgents] = useState<AgentState[]>(SEED);
  const [winner, setWinner] = useState<string | null>(null);
  const [patches, setPatches] = useState<PatchInfo[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const agentsRef = useRef<AgentState[]>(SEED);

  function setAgentState(id: string, fn: (a: AgentState) => AgentState) {
    agentsRef.current = agentsRef.current.map((a) => (a.id === id ? fn(a) : a));
    setAgents([...agentsRef.current]);
  }

  function failAgent(id: string, message: string, action: "error" | "interrupted") {
    const reason = message.replace(/^.*?\bfailed:\s*/i, "").trim() || "Run failed";
    setAgentState(id, (a) => ({
      ...a,
      status: action === "interrupted" ? "interrupted" : "error",
      error: reason,
      steps: [...a.steps, mkStep(a.steps, action, message, false)],
    }));
  }

  const started = agents.some((a) => a.status !== "waiting");

  async function run() {
    if (!url.trim() || !task.trim() || running) return;
    setRunning(true);
    setFatal(null);
    setWinner(null);
    setPatches([]);
    setCompleted(false);
    setStatus("Connecting to the live engine…");
    agentsRef.current = SEED.map((a) => ({ ...a, status: "waiting", steps: [], run: undefined, error: undefined }));
    setAgents([...agentsRef.current]);

    const body: Record<string, unknown> = { url: url.trim(), task: task.trim() };
    if (user.trim() && pass.trim()) body.credentials = { username: user.trim(), password: pass.trim() };

    let streamErr: string | null = null;
    try {
      const res = await fetch("/api/arena/custom", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error(`Live engine responded ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (line) handleEvent(JSON.parse(line.slice(6)));
        }
      }
    } catch (e) {
      streamErr = (e as Error).message;
    } finally {
      // Never leave an agent spinning: anything still running when the stream
      // ends or breaks is interrupted.
      const stillRunning = agentsRef.current.filter((a) => a.status === "running");
      stillRunning.forEach((a) =>
        failAgent(a.id, streamErr ? `Run interrupted — ${streamErr}` : "Run interrupted before this agent finished.", "interrupted"),
      );
      // A stream error before anything started is a page-level fatal.
      const anyStarted = agentsRef.current.some((a) => a.status !== "waiting");
      if (streamErr && !anyStarted) setFatal(streamErr);
      setRunning(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEvent(e: any) {
    switch (e.type) {
      case "run-started":
        setStatus("Run started.");
        break;
      case "status":
        setStatus(e.message);
        break;
      // agent-started (new) / agent-start (legacy)
      case "agent-started":
      case "agent-start":
        setStatus(`${e.agentName ?? "Agent"} is attempting the task…`);
        setAgentState(e.agentId, (a) => ({ ...a, status: "running", steps: [], error: undefined }));
        break;
      // agent-step (new) / step (legacy)
      case "agent-step":
      case "step":
        setAgentState(e.agentId, (a) => ({ ...a, steps: [...a.steps, e.step] }));
        break;
      // Structured per-agent failure — exact attribution via agentId.
      case "agent-error": {
        const id = e.agentId ?? agentsRef.current.find((a) => a.status === "running")?.id;
        if (id) failAgent(id, e.message, "error");
        break;
      }
      case "agent-done":
        // A failed run still arrives here; viewState() maps result:"fail" → Failed.
        setAgentState(e.agentId, (a) => ({ ...a, status: "done", run: e.run }));
        break;
      case "winner": // legacy
        setWinner(e.agentId);
        break;
      case "patch":
        setPatches((p) => [...p, { sourceWinner: e.sourceWinner, targets: e.targets, behavior: e.behavior }]);
        break;
      case "run-done":
        setCompleted(true);
        setWinner(e.winnerAgentId ?? null);
        setStatus("Run complete.");
        break;
      case "complete": // legacy
        setCompleted(true);
        setStatus("Run complete.");
        break;
      case "error": {
        setStatus(e.message);
        // New contract: generic `error` is fatal (page-level). Legacy streams
        // sent per-agent failures here without agentId — fall back to inferring
        // the currently-running agent (agents run one at a time).
        if (e.fatal) {
          setFatal(e.message);
          break;
        }
        const id = e.agentId ?? agentsRef.current.find((a) => a.status === "running")?.id;
        if (id) failAgent(id, e.message, "error");
        else if (agentsRef.current.every((a) => a.status === "waiting")) setFatal(e.message);
        break;
      }
    }
  }

  const canRun = !!url.trim() && !!task.trim() && !running;

  return (
    <div className="space-y-6">
      <header className="border-b border-arena-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Live Arena</h1>
        <p className="mt-1 text-sm text-arena-muted">
          Paste any website and a task. Three agents attempt it live with Gemini computer-use — watch them compete in real time.
        </p>
      </header>

      {fatal && <FatalBanner message={fatal} onRetry={run} running={running} />}

      <Panel className="p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-arena-muted">Website URL</span>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-arena-border bg-arena-panel2/50 px-3">
                <Globe size={15} className="text-arena-muted" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com"
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-arena-muted">Task</span>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Add a product to the cart  ·  Search for X and open the result  ·  Find the pricing page"
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-arena-border bg-arena-panel2/50 px-3 py-2 text-sm outline-none"
              />
              <p className="mt-1 text-[11px] text-arena-muted">
                Tip: pick a task agents can actually finish (add to cart, search, navigate). Real checkouts need
                payment and won&apos;t complete.
              </p>
            </label>
            <details className="text-xs text-arena-muted">
              <summary className="cursor-pointer select-none">Login credentials (optional)</summary>
              <div className="mt-2 flex gap-2">
                <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="username"
                  className="w-full rounded-lg border border-arena-border bg-arena-panel2/50 px-3 py-1.5 text-sm outline-none" />
                <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="password" type="password"
                  className="w-full rounded-lg border border-arena-border bg-arena-panel2/50 px-3 py-1.5 text-sm outline-none" />
              </div>
            </details>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={!canRun} className={`${BTN_PRIMARY} h-10 px-5`}>
              {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              {running ? "Running…" : "Run Live Arena"}
            </button>
          </div>
        </div>
        {running && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-arena-purpleBright">
            <Loader2 size={12} className="animate-spin" />
            {status} <span className="text-arena-muted">· live runs take a few minutes; keep this tab open.</span>
          </p>
        )}
      </Panel>

      {started && <RunSummary agents={agents} winner={winner} running={running} completed={completed} />}

      {(running || agents.some((a) => a.steps.length || a.run || a.status !== "waiting")) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {agents.map((a) => (
            <LiveAgentColumn key={a.id} agent={a} isWinner={winner === a.id} />
          ))}
        </div>
      )}

      {patches.length > 0 && (
        <Panel className="p-5">
          <SectionTitle icon={<GitMerge size={14} />}>Skill patches the winner would teach</SectionTitle>
          <ul className="mt-3 space-y-2">
            {patches.map((p, i) => (
              <li key={i} className="rounded-lg border border-arena-border bg-arena-panel2/30 px-3 py-2 text-sm">
                <span className="font-medium capitalize text-arena-neon">{p.sourceWinner}</span>
                <GitMerge size={12} className="mx-1.5 inline text-arena-muted" />
                <span className="font-medium capitalize text-arena-purpleBright">{p.targets.join(", ")}</span>
                <p className="mt-0.5 text-xs text-arena-muted">{p.behavior}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

// ── Fatal banner ──────────────────────────────────────────────────────────────
function FatalBanner({ message, onRetry, running }: { message: string; onRetry: () => void; running: boolean }) {
  const engineDown = /api[\s_-]?key|gemini|live engine|unavailable|quota|rate limit/i.test(message);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-arena-red/40 bg-arena-red/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-arena-red" />
        <div>
          <div className="text-sm font-semibold text-arena-text">{engineDown ? "Live engine unavailable" : "Live run failed"}</div>
          <p className="mt-0.5 font-mono text-xs text-arena-red/90">{message}</p>
        </div>
      </div>
      <button onClick={onRetry} disabled={running} className={`shrink-0 ${BTN_PRIMARY}`}>
        <RotateCw size={15} />
        Retry run
      </button>
    </div>
  );
}

// ── Run summary ───────────────────────────────────────────────────────────────
function RunSummary({ agents, winner, running, completed }: { agents: AgentState[]; winner: string | null; running: boolean; completed: boolean }) {
  const states = agents.map(viewState);
  const success = states.filter((s) => s === "success").length;
  const failed = states.filter((s) => s === "failed" || s === "interrupted").length;
  const inFlight = states.filter((s) => s === "running").length;
  const winnerName = winner ? agents.find((a) => a.id === winner)?.name : null;
  const settled = !running && inFlight === 0;

  return (
    <Panel className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
      <Stat label="Success" value={success} className="text-arena-neon" />
      <Stat label="Failed" value={failed} className="text-arena-red" />
      <Stat label="Running" value={inFlight} className="text-arena-purpleBright" />
      <span className="ml-auto flex items-center gap-1.5">
        <Trophy size={14} className={winnerName ? "text-arena-neon" : "text-arena-muted"} />
        <span className="text-arena-muted">Winner</span>
        <span className={`font-semibold ${winnerName ? "text-arena-neon" : "text-arena-muted"}`}>
          {winnerName ?? (settled ? "No winner selected" : "—")}
        </span>
      </span>
    </Panel>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-arena-muted">{label}</span>
      <span className={`font-bold tabular-nums ${value > 0 ? className : "text-arena-text"}`}>{value}</span>
    </span>
  );
}

// ── Agent column ──────────────────────────────────────────────────────────────
function LiveAgentColumn({ agent, isWinner }: { agent: AgentState; isWinner: boolean }) {
  const Icon = agentIcon(agent.id);
  const vs = viewState(agent);
  const meta = STATE_META[vs];
  const last = agent.steps[agent.steps.length - 1];
  const reason = agent.error ?? agent.run?.failureReason;

  return (
    <Panel className={`flex flex-col p-4 ${vs === "success" && isWinner ? "glow-neon border-arena-neon/40" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Icon size={16} className="text-arena-purpleBright" />
          <span className="font-semibold">{agent.name}</span>
          {isWinner && <Trophy size={14} className="text-arena-neon" />}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.border} ${meta.text}`}>
          {vs === "running" ? <Loader2 size={11} className="animate-spin" /> : <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
          {vs === "success" ? "Success" : vs === "failed" ? "Failed" : vs === "interrupted" ? "Interrupted" : vs === "running" ? "Running" : "Waiting"}
        </span>
      </div>

      {/* Score (settled runs) */}
      {agent.run && (vs === "success" || vs === "failed") && (
        <div className="mt-2 text-xs tabular-nums text-arena-muted">{agent.run.score}/100</div>
      )}

      {/* Reason line for failed / interrupted */}
      {(vs === "failed" || vs === "interrupted") && reason && (
        <p className={`mt-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] leading-snug ${vs === "interrupted" ? "border-arena-amber/30 bg-arena-amber/[0.05] text-arena-amber" : "border-arena-red/30 bg-arena-red/[0.05] text-arena-red"}`}>
          {reason}
        </p>
      )}

      {/* Last frame */}
      {last?.screenshot?.startsWith("data:") && (
        <img src={last.screenshot} alt="" className="mt-3 aspect-video w-full rounded-lg border border-arena-border object-cover object-top" />
      )}

      {/* Activity log */}
      {agent.steps.length > 0 ? (
        <ol className="mt-3 max-h-64 space-y-1 overflow-auto pr-1 font-mono text-[11px]">
          {agent.steps.map((s) => {
            const bad = !s.ok;
            return (
              <li key={s.index} className={`flex items-start gap-1.5 rounded px-1 py-0.5 ${bad ? "bg-arena-red/[0.06]" : ""}`}>
                <span className={`mt-px ${s.ok ? "text-arena-neon/80" : "text-arena-red"}`}>{s.ok ? "›" : "✗"}</span>
                <span className="min-w-0">
                  <span className="text-arena-muted">[{s.action}]</span>{" "}
                  <span className={bad ? "text-arena-red/90" : "text-arena-text/85"}>{s.description}</span>
                </span>
              </li>
            );
          })}
          {vs === "running" && (
            <li className="flex items-center gap-1.5 text-arena-purpleBright">
              <Loader2 size={11} className="animate-spin" /> acting…
            </li>
          )}
        </ol>
      ) : vs === "waiting" ? (
        <p className="mt-3 text-xs text-arena-muted">Waiting for next agent…</p>
      ) : vs === "running" ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-arena-purpleBright">
          <Loader2 size={11} className="animate-spin" /> Starting…
        </p>
      ) : null}
    </Panel>
  );
}
