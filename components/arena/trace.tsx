"use client";

import { useState } from "react";
import {
  Globe,
  MousePointerClick,
  Search,
  FlaskConical,
  CheckCircle2,
  FileCode2,
  XCircle,
  Circle,
  type LucideIcon,
} from "lucide-react";
import type { Run, TournamentState, TraceStep } from "@/lib/arena/types";
import { roundByNumber, runForAgent } from "@/lib/arena/view";
import { agentIcon, NotAvailable, Panel, SectionTitle } from "./ui";

const ACTION_ICON: Record<string, LucideIcon> = {
  navigate: Globe,
  browser: MousePointerClick,
  inspect: Search,
  test: FlaskConical,
  verify: CheckCircle2,
  edit: FileCode2,
  halt: XCircle,
};
const stepIcon = (a: string): LucideIcon => ACTION_ICON[a] ?? Circle;

// Filter chips map onto the action categories the trace actually carries.
const FILTERS: { key: string; label: string; match: (s: TraceStep) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "browser", label: "Browser", match: (s) => s.action === "navigate" || s.action === "browser" },
  { key: "inspect", label: "Inspect", match: (s) => s.action === "inspect" },
  { key: "edit", label: "Edits", match: (s) => s.action === "edit" },
  { key: "test", label: "Tests", match: (s) => s.action === "test" },
  { key: "verify", label: "Verify", match: (s) => s.action === "verify" || s.action === "halt" },
];

export function TraceTimeline({ steps }: { steps: TraceStep[] }) {
  if (!steps.length) return <p className="py-6 text-center text-sm text-arena-muted">No steps match this filter.</p>;
  return (
    <ol className="space-y-1.5">
      {steps.map((s) => {
        const Icon = stepIcon(s.action);
        return (
          <li key={s.index} className="flex items-start gap-3 rounded-lg border border-arena-border bg-arena-panel2/30 px-3 py-2">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${s.ok ? "border-arena-neon/40 text-arena-neon" : "border-arena-fail/40 text-arena-fail"}`}>
              <Icon size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-arena-muted">{s.action}</span>
                <span className={`text-[10px] ${s.ok ? "text-arena-neon" : "text-arena-fail"}`}>{s.ok ? "ok" : "blocked"}</span>
              </div>
              <p className="text-sm text-arena-text/90">{s.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TraceInspector({ state, defaultAgent = "verifier" }: { state: TournamentState; defaultAgent?: string }) {
  const [agentId, setAgentId] = useState(defaultAgent);
  const [round, setRound] = useState<number>(state.rounds[state.rounds.length - 1]?.round ?? 1);
  const [filter, setFilter] = useState("all");

  const run: Run | undefined = runForAgent(roundByNumber(state, round), agentId);
  const steps = run ? run.steps.filter(FILTERS.find((f) => f.key === filter)!.match) : [];

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
              <button
                key={a.id}
                onClick={() => setAgentId(a.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${active ? "bg-arena-purple/20 text-arena-text" : "text-arena-muted hover:text-arena-text"}`}
              >
                <Icon size={13} />
                {a.name}
              </button>
            );
          })}
        </div>
        <div className="flex rounded-lg border border-arena-border p-0.5">
          {state.rounds.map((r) => (
            <button
              key={r.round}
              onClick={() => setRound(r.round)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${r.round === round ? "bg-arena-purple/20 text-arena-text" : "text-arena-muted hover:text-arena-text"}`}
            >
              Round {r.round}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count = run ? run.steps.filter(f.match).length : 0;
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${active ? "border-arena-purpleBright/60 text-arena-purpleBright" : "border-arena-border text-arena-muted hover:text-arena-text"}`}
            >
              {f.label} <span className="tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="mt-3">{run ? <TraceTimeline steps={steps} /> : <p className="py-6 text-center text-sm text-arena-muted">No trace for this round yet.</p>}</div>

      {/* Final state + failure reason from real fields */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-lg border border-arena-border bg-arena-panel2/30 p-3">
          <div className="text-[10px] uppercase tracking-wider text-arena-muted">Final state</div>
          <div className={`mt-0.5 text-sm font-medium ${run?.result === "success" ? "text-arena-neon" : "text-arena-text"}`}>
            {run?.finalState ?? <NotAvailable />}
          </div>
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
