"use client";

import { Library, Sparkles, GitMerge, Users, ArrowRight } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import { librarySummary, skillLibrary, type LibrarySkill } from "@/lib/arena/view";
import { agentIcon, Panel, SectionTitle } from "./ui";

const nameFor = (state: TournamentState, id: string) => state.agents.find((a) => a.id === id)?.name ?? id;

export function SkillLibrary({ state }: { state: TournamentState }) {
  const lib = skillLibrary(state);
  const summary = librarySummary(state);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Library size={15} />} label="Capabilities" value={summary.capabilities} />
        <Stat icon={<GitMerge size={15} />} label="Skills transferred" value={summary.transfers} accent />
        <Stat icon={<Sparkles size={15} />} label="Fully adopted" value={`${summary.fullyAdopted}/${summary.capabilities}`} accent />
        <Stat icon={<Users size={15} />} label="Agents" value={summary.agents} />
      </div>

      {/* Per-skill cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {lib.map((sk) => (
          <SkillCard key={sk.tag} state={state} skill={sk} />
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <Panel className="p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-arena-muted">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-arena-neon" : "text-arena-text"}`}>{value}</div>
    </Panel>
  );
}

function SkillCard({ state, skill }: { state: TournamentState; skill: LibrarySkill }) {
  const total = state.agents.length || 1;
  const pctWidth = `${Math.round(skill.coverage * 100)}%`;
  const innate = skill.holders.filter((h) => h.origin === "innate");
  const learned = skill.holders.filter((h) => h.origin === "patch");
  const learnedRound = learned[0]?.learnedRound;

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{skill.label}</div>
          <p className="mt-0.5 text-xs text-arena-muted">{skill.desc}</p>
        </div>
        {skill.learnedCount > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-arena-neon/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-arena-neon">
            <GitMerge size={11} />
            Propagated
          </span>
        )}
      </div>

      {/* Coverage bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-arena-panel2">
          <div className="h-full rounded-full bg-arena-neon" style={{ width: pctWidth }} />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-arena-muted">
          {skill.holders.length} / {total} agents
        </span>
      </div>

      {/* Holders */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skill.holders.map((h) => {
          const Icon = agentIcon(h.agentId);
          const learnedHere = h.origin === "patch";
          return (
            <span
              key={h.agentId}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                learnedHere ? "border-arena-neon/40 text-arena-neon" : "border-arena-border text-arena-text/80"
              }`}
              title={learnedHere ? `Learned from ${nameFor(state, h.learnedFrom ?? "")}` : "Innate"}
            >
              <Icon size={12} />
              {nameFor(state, h.agentId)}
              {learnedHere && <span className="text-[9px] uppercase tracking-wide opacity-70">learned</span>}
            </span>
          );
        })}
      </div>

      {/* Propagation story */}
      {learned.length > 0 && skill.taughtBy && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-arena-muted">
          <span className="font-medium text-arena-neon">{nameFor(state, skill.taughtBy)}</span>
          <ArrowRight size={12} />
          <span>
            taught {learned.map((h) => nameFor(state, h.agentId)).join(", ")}
            {learnedRound ? ` in round ${learnedRound}` : ""}
          </span>
        </p>
      )}
      {learned.length === 0 && (
        <p className="mt-3 text-xs text-arena-muted">
          Innate to {innate.map((h) => nameFor(state, h.agentId)).join(", ") || "—"}.
        </p>
      )}
    </Panel>
  );
}

// A compact transfer log of the raw skill patches.
export function SkillTransferLog({ state }: { state: TournamentState }) {
  if (state.patches.length === 0) return null;
  return (
    <Panel className="p-4">
      <SectionTitle icon={<GitMerge size={14} />}>Transfer log</SectionTitle>
      <ul className="mt-3 space-y-2">
        {state.patches.map((p) => (
          <li key={p.id} className="rounded-lg border border-arena-border bg-arena-panel2/30 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-arena-neon">{nameFor(state, p.sourceWinner)}</span>
              <ArrowRight size={13} className="text-arena-muted" />
              <span className="font-medium text-arena-purpleBright">{p.targetAgents.map((t) => nameFor(state, t)).join(", ")}</span>
              <span className="ml-auto text-[11px] text-arena-muted">round {p.round}</span>
            </div>
            <p className="mt-1 text-xs text-arena-muted">{p.winningBehavior}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
