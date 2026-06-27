"use client";

import { useState } from "react";
import { ArrowRight, TrendingUp, Check, X } from "lucide-react";
import type { TournamentState, TraceStep } from "@/lib/arena/types";
import { agentScores, isComplete, patchedAgentIds, roundByNumber, runForAgent } from "@/lib/arena/view";
import { agentIcon, Panel, SectionTitle } from "./ui";

export function BeforeAfterComparison({ state }: { state: TournamentState }) {
  const patched = patchedAgentIds(state);
  const [agentId, setAgentId] = useState(patched[0] ?? state.agents[0]?.id ?? "planner");

  if (!isComplete(state)) {
    return (
      <Panel className="p-4">
        <SectionTitle icon={<TrendingUp size={14} />}>Agent Evolution</SectionTitle>
        <p className="mt-3 text-sm text-arena-muted">Run the rematch to see how patched agents change.</p>
      </Panel>
    );
  }

  const beforeRun = runForAgent(roundByNumber(state, 1), agentId);
  const afterRun = runForAgent(state.rounds[state.rounds.length - 1], agentId);
  const { round1, latest } = agentScores(state, agentId);
  const name = state.agents.find((a) => a.id === agentId)?.name ?? agentId;

  return (
    <Panel className="p-4">
      <SectionTitle
        icon={<TrendingUp size={14} className="text-arena-neon" />}
        right={
          <div className="flex rounded-lg border border-arena-border p-0.5">
            {patched.map((id) => {
              const Icon = agentIcon(id);
              const active = id === agentId;
              return (
                <button
                  key={id}
                  onClick={() => setAgentId(id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${active ? "bg-arena-purple/20 text-arena-text" : "text-arena-muted hover:text-arena-text"}`}
                >
                  <Icon size={13} />
                  {state.agents.find((a) => a.id === id)?.name ?? id}
                </button>
              );
            })}
          </div>
        }
      >
        Agent Evolution
      </SectionTitle>

      {round1 !== undefined && latest !== undefined && (
        <p className="mt-3 text-sm">
          <span className="font-semibold">{name}</span> improved from{" "}
          <span className="font-bold tabular-nums text-arena-purpleBright">{round1}</span>
          <ArrowRight size={13} className="mx-1 inline -translate-y-px text-arena-muted" />
          <span className="font-bold tabular-nums text-arena-neon">{latest}</span> after the skill patch.
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Column title="Before patch · Round 1" steps={beforeRun?.steps ?? []} tone="before" />
        <Column title="After patch" steps={afterRun?.steps ?? []} tone="after" />
      </div>
    </Panel>
  );
}

function Column({ title, steps, tone }: { title: string; steps: TraceStep[]; tone: "before" | "after" }) {
  return (
    <div className={`rounded-lg border p-3 ${tone === "after" ? "border-arena-neon/30 bg-arena-neon/[0.03]" : "border-arena-border bg-arena-panel2/30"}`}>
      <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${tone === "after" ? "text-arena-neon" : "text-arena-muted"}`}>
        {title}
      </div>
      <ol className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.index} className="flex items-start gap-2 text-sm">
            {s.ok ? (
              <Check size={14} className="mt-0.5 shrink-0 text-arena-neon" />
            ) : (
              <X size={14} className="mt-0.5 shrink-0 text-arena-fail" />
            )}
            <span className={s.ok ? "text-arena-text/85" : "text-arena-fail"}>{shortStep(s.description)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Trim the engine's "Label — done. Detail" to a compact line.
function shortStep(desc: string): string {
  return desc.split(" — ")[0].replace(/\.$/, "");
}
