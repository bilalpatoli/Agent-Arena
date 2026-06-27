"use client";

import { Users } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import { agentScores } from "@/lib/arena/view";
import { agentIcon, NotAvailable, Panel, SectionTitle } from "./ui";

export function PopulationImprovementTable({ state }: { state: TournamentState }) {
  const rows = state.agents.map((a) => ({ id: a.id, name: a.name, ...agentScores(state, a.id) }));

  return (
    <Panel className="p-4">
      <SectionTitle icon={<Users size={14} />}>Population Improved</SectionTitle>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-arena-muted">
            <th className="pb-2 text-left font-semibold">Agent</th>
            <th className="pb-2 text-right font-semibold">Round 1</th>
            <th className="pb-2 text-right font-semibold">Latest</th>
            <th className="pb-2 text-right font-semibold">Improvement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const Icon = agentIcon(p.id);
            return (
              <tr key={p.id} className="border-t border-arena-border">
                <td className="py-2.5">
                  <span className="flex items-center gap-2 font-medium">
                    <Icon size={15} className={p.improvement && p.improvement > 0 ? "text-arena-purpleBright" : "text-arena-neon"} />
                    {p.name}
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums text-arena-purpleBright">{p.round1 ?? <NotAvailable />}</td>
                <td className="py-2.5 text-right tabular-nums font-semibold text-arena-neon">{p.latest ?? <NotAvailable />}</td>
                <td className="py-2.5 text-right tabular-nums font-bold">
                  {p.improvement === undefined ? (
                    <NotAvailable />
                  ) : p.improvement > 0 ? (
                    <span className="text-arena-neon">+{p.improvement}</span>
                  ) : (
                    <span className="text-arena-muted">0</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}
