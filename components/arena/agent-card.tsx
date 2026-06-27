"use client";

import { GitMerge } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import { AGENT_IDENTITY, agentScores, agentStatus, patchesForAgent } from "@/lib/arena/view";
import { agentIcon, StatusBadge, NotAvailable } from "./ui";

export function AgentCard({ state, id }: { state: TournamentState; id: string }) {
  const agent = state.agents.find((a) => a.id === id);
  if (!agent) return null;
  const Icon = agentIcon(id);
  const status = agentStatus(state, id);
  const { round1, latest, improvement } = agentScores(state, id);
  const identity = AGENT_IDENTITY[id] ?? {};
  const patched = patchesForAgent(state, id).length > 0;
  const win = status === "winner" || status === "success";

  return (
    <div className={`flex flex-col rounded-2xl border bg-arena-panel p-5 transition-transform duration-200 hover:-translate-y-0.5 ${win ? "border-arena-neon/40" : "border-arena-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-lg border ${win ? "border-arena-neon/40 text-arena-neon" : "border-arena-purple/30 text-arena-purpleBright"}`}>
            <Icon size={20} />
          </span>
          <div>
            <div className="text-base font-semibold leading-tight">{agent.name}</div>
            <div className="text-xs text-arena-muted">{agent.tagline}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold tabular-nums leading-none ${win ? "text-arena-neon" : "text-arena-text"}`}>
            {latest ?? <NotAvailable />}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-arena-muted">Score</div>
        </div>
      </div>

      <div className="mt-3">
        <StatusBadge status={status} />
      </div>

      {/* Round comparison */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-arena-border bg-arena-panel2/40 p-2.5 text-center">
        <Stat label="Round 1" value={round1} />
        <Stat label="Latest" value={latest} accent={win} />
        <Stat
          label="Δ"
          value={improvement === undefined ? undefined : improvement > 0 ? `+${improvement}` : `${improvement}`}
          accent={improvement !== undefined && improvement > 0}
        />
      </div>

      {/* Identity */}
      <dl className="mt-3 space-y-1.5 text-xs">
        <Row term="Strategy" desc={agent.strategy.split(".")[0]} />
        {identity.strength && <Row term="Strength" desc={identity.strength} good />}
        {identity.weakness && <Row term="Weakness" desc={identity.weakness} />}
      </dl>

      {patched && (
        <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md border border-arena-purpleBright/40 px-2 py-0.5 text-[11px] font-medium text-arena-purpleBright">
          <GitMerge size={12} />
          Skill patch applied
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value?: number | string; accent?: boolean }) {
  return (
    <div>
      <div className={`text-sm font-bold tabular-nums ${accent ? "text-arena-neon" : "text-arena-text"}`}>
        {value ?? "—"}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-arena-muted">{label}</div>
    </div>
  );
}

function Row({ term, desc, good }: { term: string; desc: string; good?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-arena-muted">{term}</dt>
      <dd className={good ? "text-arena-neon/90" : "text-arena-text/85"}>{desc}</dd>
    </div>
  );
}
