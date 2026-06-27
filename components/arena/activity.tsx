"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check, X, Activity } from "lucide-react";
import type { Agent, Run } from "@/lib/arena/types";
import type { LiveRound } from "./use-arena";
import { agentIcon, Panel, SectionTitle } from "./ui";

// Live activity feed: when a round completes, stream each agent's real steps
// into a per-agent log so you can watch what every agent is doing.
export function AgentActivity({ liveRound, agents }: { liveRound: LiveRound; agents: Agent[] }) {
  const runs = liveRound.runs;
  const maxSteps = runs.reduce((m, r) => Math.max(m, r.steps.length), 0);
  const [revealed, setRevealed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  // Re-stream whenever a new round arrives.
  useEffect(() => {
    setRevealed(0);
    if (!maxSteps) return;
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= maxSteps && timer.current) clearInterval(timer.current);
    }, 240);
    return () => timer.current && clearInterval(timer.current);
  }, [liveRound, maxSteps]);

  const nameFor = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

  return (
    <Panel className="p-4">
      <SectionTitle
        icon={<Activity size={14} className="text-arena-purpleBright" />}
        right={<span className="text-[11px] font-semibold uppercase tracking-wide text-arena-muted">Round {liveRound.which}</span>}
      >
        Live activity
      </SectionTitle>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {runs.map((run) => (
          <AgentColumn key={run.agentId} run={run} name={nameFor(run.agentId)} revealed={revealed} />
        ))}
      </div>
    </Panel>
  );
}

function AgentColumn({ run, name, revealed }: { run: Run; name: string; revealed: number }) {
  const Icon = agentIcon(run.agentId);
  const shown = run.steps.slice(0, revealed);
  const done = revealed >= run.steps.length;
  const success = run.result === "success";

  return (
    <div className="flex flex-col rounded-lg border border-arena-border bg-arena-panel2/30">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-arena-border px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon size={15} className="text-arena-purpleBright" />
          {name}
        </span>
        {!done ? (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-arena-purpleBright">
            <Loader2 size={12} className="animate-spin" />
            Working
          </span>
        ) : (
          <span className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${success ? "text-arena-neon" : "text-arena-fail"}`}>
            {success ? <Check size={12} /> : <X size={12} />}
            {run.score}
          </span>
        )}
      </div>

      {/* Log */}
      <ol className="flex max-h-56 flex-col gap-1 overflow-auto p-2.5 font-mono text-[11px]">
        {shown.map((s) => (
          <li key={s.index} className="flex items-start gap-1.5 leading-snug">
            <span className={s.ok ? "text-arena-neon/70" : "text-arena-fail/80"}>{s.ok ? "›" : "✗"}</span>
            <span className="text-arena-muted">[{s.action}]</span>
            <span className="text-arena-text/85">{shorten(s.description)}</span>
          </li>
        ))}
        {!done && (
          <li className="flex items-center gap-1.5 text-arena-purpleBright/70">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-arena-purpleBright" />
          </li>
        )}
      </ol>
    </div>
  );
}

function shorten(desc: string): string {
  const head = desc.split(" — ")[0];
  return head.length > 64 ? head.slice(0, 62) + "…" : head;
}
