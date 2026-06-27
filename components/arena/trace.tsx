"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  MousePointerClick,
  Search,
  FlaskConical,
  CheckCircle2,
  FileCode2,
  XCircle,
  Circle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  type LucideIcon,
} from "lucide-react";
import type { Run, TournamentState, TraceStep } from "@/lib/arena/types";
import { roundByNumber, runForAgent } from "@/lib/arena/view";
import { agentIcon, NotAvailable, Panel, SectionTitle } from "./ui";

const ACTION_ICON: Record<string, LucideIcon> = {
  navigate: Globe,
  browser: MousePointerClick,
  click: MousePointerClick,
  type: MousePointerClick,
  inspect: Search,
  test: FlaskConical,
  verify: CheckCircle2,
  edit: FileCode2,
  halt: XCircle,
  scroll: MousePointerClick,
};
const stepIcon = (a: string): LucideIcon => ACTION_ICON[a] ?? Circle;

// A real captured frame is a data/http/absolute URL; synthetic ids are not.
const isFrame = (s?: string) => !!s && (s.startsWith("data:") || s.startsWith("http") || s.startsWith("/"));

const FILTERS: { key: string; label: string; match: (s: TraceStep) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "browser", label: "Browser", match: (s) => ["navigate", "browser", "click", "type", "scroll"].includes(s.action) },
  { key: "inspect", label: "Inspect", match: (s) => s.action === "inspect" },
  { key: "edit", label: "Edits", match: (s) => s.action === "edit" },
  { key: "test", label: "Tests", match: (s) => s.action === "test" },
  { key: "verify", label: "Verify", match: (s) => s.action === "verify" || s.action === "halt" },
];

// ── Playback: scrub through the agent's real captured browser frames ───────────
function TracePlayer({ steps, current, onScrub }: { steps: TraceStep[]; current: number; onScrub: (i: number) => void }) {
  const [playing, setPlaying] = useState(false);
  const step = steps[current];
  const hasFrames = steps.some((s) => isFrame(s.screenshot));

  // Auto-advance while playing; stop at the end.
  useEffect(() => {
    if (!playing) return;
    if (current >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => onScrub(current + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, current, steps.length, onScrub]);

  // Pause if the underlying run changes.
  useEffect(() => setPlaying(false), [steps]);

  if (!step) return null;

  return (
    <div className="rounded-xl border border-arena-border bg-black/40 p-3">
      {/* Frame */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-arena-border bg-black">
        {isFrame(step.screenshot) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={step.screenshot} alt={`Step ${current + 1}`} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-arena-muted">
            <ImageOff size={26} />
            <span className="text-xs">{hasFrames ? "No frame for this step" : "Synthetic run — no captured frames"}</span>
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${step.ok ? "border-arena-neon/50 bg-black/60 text-arena-neon" : "border-arena-fail/50 bg-black/60 text-arena-fail"}`}>
          {step.action} · {step.ok ? "ok" : "blocked"}
        </span>
      </div>

      {/* Caption */}
      <p className="mt-2 min-h-[2.5rem] text-sm text-arena-text/90">{step.description}</p>

      {/* Controls */}
      <div className="mt-1 flex items-center gap-3">
        <button onClick={() => onScrub(Math.max(0, current - 1))} disabled={current === 0} className="rounded-md border border-arena-border p-1.5 text-arena-text disabled:opacity-40 hover:border-arena-purple/60">
          <ChevronLeft size={15} />
        </button>
        <button onClick={() => setPlaying((p) => !p)} className="rounded-md border border-arena-purple/50 bg-arena-purple/15 p-1.5 text-arena-purpleBright hover:bg-arena-purple/25">
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={() => onScrub(Math.min(steps.length - 1, current + 1))} disabled={current === steps.length - 1} className="rounded-md border border-arena-border p-1.5 text-arena-text disabled:opacity-40 hover:border-arena-purple/60">
          <ChevronRight size={15} />
        </button>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={current}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer accent-arena-purple"
        />
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-arena-muted">
          {current + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}

function TraceTimeline({
  steps,
  current,
  onSelect,
}: {
  steps: TraceStep[];
  current: number;
  onSelect: (i: number) => void;
}) {
  if (!steps.length) return <p className="py-6 text-center text-sm text-arena-muted">No steps match this filter.</p>;
  return (
    <ol className="max-h-64 space-y-1.5 overflow-auto pr-1">
      {steps.map((s) => {
        const Icon = stepIcon(s.action);
        const active = s.index === current;
        return (
          <li key={s.index}>
            <button
              onClick={() => onSelect(s.index)}
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                active ? "border-arena-purple/60 bg-arena-purple/10" : "border-arena-border bg-arena-panel2/30 hover:border-arena-purple/40"
              }`}
            >
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${s.ok ? "border-arena-neon/40 text-arena-neon" : "border-arena-fail/40 text-arena-fail"}`}>
                <Icon size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-arena-muted">{s.action}</span>
                  {isFrame(s.screenshot) && <span className="text-[9px] uppercase tracking-wider text-arena-purpleBright/70">frame</span>}
                </div>
                <p className="truncate text-sm text-arena-text/90">{s.description}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function TraceInspector({ state, defaultAgent = "verifier" }: { state: TournamentState; defaultAgent?: string }) {
  const fallbackAgent = state.agents.some((a) => a.id === defaultAgent) ? defaultAgent : state.agents[0]?.id;
  const [agentId, setAgentId] = useState(fallbackAgent);
  const [round, setRound] = useState<number>(state.rounds[state.rounds.length - 1]?.round ?? 1);
  const [filter, setFilter] = useState("all");
  const [current, setCurrent] = useState(0);

  const run: Run | undefined = runForAgent(roundByNumber(state, round), agentId);
  const allSteps = run?.steps ?? [];
  const shown = allSteps.filter(FILTERS.find((f) => f.key === filter)!.match);

  // Reset playback head when the run changes.
  useEffect(() => setCurrent(0), [agentId, round]);

  return (
    <Panel className="p-4">
      <SectionTitle icon={<Search size={14} />}>Trace Inspector</SectionTitle>

      {/* Agent + round selectors */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-arena-border p-0.5">
          {state.agents.map((a) => {
            const Icon = agentIcon(a.id);
            const active = a.id === agentId;
            return (
              <button key={a.id} onClick={() => setAgentId(a.id)} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${active ? "bg-arena-purple/20 text-arena-text" : "text-arena-muted hover:text-arena-text"}`}>
                <Icon size={13} />
                {a.name}
              </button>
            );
          })}
        </div>
        <div className="flex rounded-lg border border-arena-border p-0.5">
          {state.rounds.map((r) => (
            <button key={r.round} onClick={() => setRound(r.round)} className={`rounded-md px-2.5 py-1 text-xs font-medium ${r.round === round ? "bg-arena-purple/20 text-arena-text" : "text-arena-muted hover:text-arena-text"}`}>
              Round {r.round}
            </button>
          ))}
        </div>
      </div>

      {run && allSteps.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          {/* Playback */}
          <TracePlayer steps={allSteps} current={current} onScrub={setCurrent} />

          {/* Filters + timeline */}
          <div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const count = allSteps.filter(f.match).length;
                const active = f.key === filter;
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${active ? "border-arena-purpleBright/60 text-arena-purpleBright" : "border-arena-border text-arena-muted hover:text-arena-text"}`}>
                    {f.label} <span className="tabular-nums opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <TraceTimeline steps={shown} current={current} onSelect={setCurrent} />
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 py-6 text-center text-sm text-arena-muted">No trace for this round yet.</p>
      )}

      {/* Final state + failure reason from real fields */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-lg border border-arena-border bg-arena-panel2/30 p-3">
          <div className="text-[10px] uppercase tracking-wider text-arena-muted">Final state</div>
          <div className={`mt-0.5 text-sm font-medium ${run?.result === "success" ? "text-arena-neon" : "text-arena-text"}`}>{run?.finalState ?? <NotAvailable />}</div>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel2/30 p-3">
          <div className="text-[10px] uppercase tracking-wider text-arena-muted">Failure reason</div>
          <div className="mt-0.5 text-sm text-arena-text/90">
            {run ? run.failureReason ?? <span className="text-arena-neon">None — task completed</span> : <NotAvailable />}
          </div>
        </div>
      </div>
    </Panel>
  );
}
