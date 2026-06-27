"use client";

import { GitMerge, Dna } from "lucide-react";
import type { SkillPatch, TournamentState } from "@/lib/arena/types";
import { headlinePatch, patchedAgentIds } from "@/lib/arena/view";
import { NotAvailable, Panel, SectionTitle } from "./ui";

const nameFor = (state: TournamentState, id: string) => state.agents.find((a) => a.id === id)?.name ?? id;

export function SkillPatchViewer({ state, patch }: { state: TournamentState; patch?: SkillPatch }) {
  const p = patch ?? headlinePatch(state);
  if (!p) {
    return (
      <Panel className="p-4">
        <SectionTitle icon={<Dna size={14} />}>Skill Patch</SectionTitle>
        <p className="mt-3 text-sm text-arena-muted">No skill patch generated yet.</p>
      </Panel>
    );
  }

  const targets = patchedAgentIds(state);
  const lines = p.newSkillText.split(/(?<=\.)\s+/).map((l) => l.trim()).filter(Boolean);
  let applied = p.appliedAt as string | undefined;
  try {
    applied = applied ? new Date(applied).toLocaleString() : undefined;
  } catch {
    /* keep raw */
  }

  return (
    <Panel className="p-4">
      <SectionTitle
        icon={<Dna size={14} className="text-arena-neon" />}
        right={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-arena-neon/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-arena-neon">
            <GitMerge size={11} />
            Applied
          </span>
        }
      >
        Skill Patch
      </SectionTitle>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        <Field term="Source winner" desc={<span className="text-arena-neon">{nameFor(state, p.sourceWinner)}</span>} />
        <Field term="Target agents" desc={<span className="text-arena-purpleBright">{targets.map((t) => nameFor(state, t)).join(", ")}</span>} />
        <Field term="Winning behavior" desc={p.winningBehavior} full />
        <Field term="Failure corrected" desc={p.failureCorrected} full />
        <Field term="Confidence" desc={<NotAvailable />} />
        <Field term="Applied" desc={applied ?? <NotAvailable />} />
      </dl>

      <div className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-arena-muted">Patch</div>
      <div className="mt-1.5 whitespace-pre-wrap rounded-lg border border-arena-neon/20 bg-black/50 p-3 font-mono text-[12px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3 text-arena-neon">
            <span className="select-none text-arena-neonDim">{i + 1}</span>
            <span className="min-w-0 break-words">
              <span className="text-arena-neon/70">+ </span>
              {line}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Field({ term, desc, full }: { term: string; desc: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wider text-arena-muted">{term}</dt>
      <dd className="mt-0.5 text-arena-text/90">{desc}</dd>
    </div>
  );
}
