"use client";

import { useRef, useState } from "react";
import { Play, Globe, Trophy, GitMerge, Loader2, Check, X } from "lucide-react";
import type { Run, TraceStep } from "@/lib/arena/types";
import { Panel, SectionTitle, agentIcon } from "./ui";

type AgentState = {
  id: string;
  name: string;
  status: "waiting" | "running" | "done" | "error";
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
  const agentsRef = useRef<AgentState[]>(SEED);

  function setAgentState(id: string, fn: (a: AgentState) => AgentState) {
    agentsRef.current = agentsRef.current.map((a) => (a.id === id ? fn(a) : a));
    setAgents([...agentsRef.current]);
  }

  async function run() {
    if (!url.trim() || !task.trim() || running) return;
    setRunning(true);
    setFatal(null);
    setWinner(null);
    setPatches([]);
    setStatus("Connecting…");
    agentsRef.current = SEED.map((a) => ({ ...a, status: "waiting", steps: [], run: undefined, error: undefined }));
    setAgents([...agentsRef.current]);

    const body: any = { url: url.trim(), task: task.trim() };
    if (user.trim() && pass.trim()) body.credentials = { username: user.trim(), password: pass.trim() };

    try {
      const res = await fetch("/api/arena/custom", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error(`Server responded ${res.status}`);

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
          if (!line) continue;
          handleEvent(JSON.parse(line.slice(6)));
        }
      }
    } catch (e) {
      setFatal((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function handleEvent(e: any) {
    switch (e.type) {
      case "status":
        setStatus(e.message);
        break;
      case "agent-start":
        setStatus(`${e.agentName} is attempting the task…`);
        setAgentState(e.agentId, (a) => ({ ...a, status: "running", steps: [] }));
        break;
      case "step":
        setAgentState(e.agentId, (a) => ({ ...a, steps: [...a.steps, e.step] }));
        break;
      case "agent-done":
        setAgentState(e.agentId, (a) => ({ ...a, status: "done", run: e.run }));
        break;
      case "winner":
        setWinner(e.agentId);
        break;
      case "patch":
        setPatches((p) => [...p, { sourceWinner: e.sourceWinner, targets: e.targets, behavior: e.behavior }]);
        break;
      case "error": {
        setStatus(e.message);
        // Agents run one at a time, so a per-agent failure belongs to whichever
        // agent is currently running. Mark it failed and log the failure so it
        // shows in the column instead of spinning forever. Otherwise it's fatal
        // (e.g. missing key / no runs completed).
        const active = agentsRef.current.find((a) => a.status === "running");
        if (active) {
          const reason = e.message.replace(/^.*?\bfailed:\s*/i, "").trim() || "Run failed";
          setAgentState(active.id, (a) => ({
            ...a,
            status: "error",
            error: reason,
            steps: [...a.steps, { index: a.steps.length, action: "error", description: e.message, ok: false }],
          }));
        } else {
          setFatal(e.message);
        }
        break;
      }
      case "complete":
        setStatus("Done.");
        break;
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-arena-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Live Arena</h1>
        <p className="mt-1 text-sm text-arena-muted">
          Paste any website and a task. Three agents attempt it live with Gemini computer-use — watch them compete in real time.
        </p>
      </header>

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
                placeholder="Search for 'Alan Turing' and open his article."
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-arena-border bg-arena-panel2/50 px-3 py-2 text-sm outline-none"
              />
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
            <button
              onClick={run}
              disabled={running || !url.trim() || !task.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-arena-purple px-5 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(139,92,246,0.9)] disabled:opacity-50"
            >
              {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              {running ? "Running…" : "Run Live Arena"}
            </button>
          </div>
        </div>
        {running && (
          <p className="mt-3 text-xs text-arena-purpleBright">
            <Loader2 size={12} className="mr-1 inline animate-spin" />
            {status} <span className="text-arena-muted">· live runs take a few minutes; keep this tab open.</span>
          </p>
        )}
        {fatal && <p className="mt-3 text-xs text-arena-fail">{fatal}</p>}
      </Panel>

      {(running || agents.some((a) => a.steps.length || a.run)) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {agents.map((a) => (
            <LiveAgentColumn key={a.id} agent={a} isWinner={winner === a.id} />
          ))}
        </div>
      )}

      {patches.length > 0 && (
        <Panel className="p-4">
          <SectionTitle icon={<GitMerge size={14} />}>Skill patches the winner would teach</SectionTitle>
          <ul className="mt-3 space-y-2">
            {patches.map((p, i) => (
              <li key={i} className="rounded-lg border border-arena-border bg-arena-panel2/30 px-3 py-2 text-sm">
                <span className="font-medium text-arena-neon capitalize">{p.sourceWinner}</span>
                <GitMerge size={12} className="mx-1.5 inline text-arena-muted" />
                <span className="font-medium text-arena-purpleBright capitalize">{p.targets.join(", ")}</span>
                <p className="mt-0.5 text-xs text-arena-muted">{p.behavior}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function LiveAgentColumn({ agent, isWinner }: { agent: AgentState; isWinner: boolean }) {
  const Icon = agentIcon(agent.id);
  const last = agent.steps[agent.steps.length - 1];
  return (
    <Panel className={`flex flex-col p-4 ${isWinner ? "glow-neon" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Icon size={16} className="text-arena-purpleBright" />
          <span className="font-semibold">{agent.name}</span>
          {isWinner && <Trophy size={14} className="text-arena-neon" />}
        </span>
        <StatusDot agent={agent} />
      </div>

      {agent.run && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className={agent.run.result === "success" ? "text-arena-neon" : "text-arena-fail"}>
            {agent.run.result === "success" ? "✓ success" : "✗ failed"}
          </span>
          <span className="tabular-nums text-arena-muted">{agent.run.score}/100</span>
        </div>
      )}

      {agent.status === "error" && !agent.run && (
        <div className="mt-2 flex items-start gap-2 text-xs">
          <span className="shrink-0 text-arena-fail">✗ failed</span>
          {agent.error && <span className="text-arena-muted">{agent.error}</span>}
        </div>
      )}

      {last?.screenshot?.startsWith("data:") && (
        <img src={last.screenshot} alt="" className="mt-3 aspect-video w-full rounded border border-arena-border object-cover object-top" />
      )}

      <ol className="mt-3 max-h-64 space-y-1.5 overflow-auto pr-1">
        {agent.steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-xs">
            <span className={`mt-0.5 ${s.ok ? "text-arena-neon" : "text-arena-fail"}`}>{s.ok ? "✓" : "✗"}</span>
            <span className="text-arena-muted">
              <span className="font-medium text-arena-text/80">{s.action}</span> {s.description}
            </span>
          </li>
        ))}
        {agent.status === "running" && (
          <li className="flex items-center gap-2 text-xs text-arena-purpleBright">
            <Loader2 size={11} className="animate-spin" /> acting…
          </li>
        )}
      </ol>
      {agent.status === "waiting" && <p className="mt-3 text-xs text-arena-muted">Waiting for its turn…</p>}
    </Panel>
  );
}

function StatusDot({ agent }: { agent: AgentState }) {
  if (agent.status === "running")
    return <Loader2 size={14} className="animate-spin text-arena-purpleBright" />;
  if (agent.status === "error") return <X size={14} className="text-arena-fail" />;
  if (agent.status === "done" && agent.run?.result === "success")
    return <Check size={14} className="text-arena-neon" />;
  if (agent.status === "done") return <X size={14} className="text-arena-fail" />;
  return <span className="h-2 w-2 rounded-full bg-arena-border" />;
}
