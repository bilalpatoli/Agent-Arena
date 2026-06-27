"use client";

import { useState } from "react";
import type { RoundResult, SkillPatch, TournamentState } from "@/lib/arena/types";

type DemoResponse = {
  state: TournamentState;
  round1: RoundResult;
  patches: SkillPatch[];
  round2: RoundResult;
};

export default function ArenaPage() {
  const [data, setData] = useState<DemoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runDemo() {
    setLoading(true);
    const res = await fetch("/api/arena/demo", { method: "POST" });
    setData(await res.json());
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🏟 Agent Arena
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Agents compete. Winners teach. Losers evolve. — an evolutionary tournament for AI agents.
        </p>
        <button
          onClick={runDemo}
          disabled={loading}
          className="mt-5 rounded-lg bg-arena-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Running tournament…" : "Run Tournament ▶"}
        </button>
      </header>

      {data && (
        <div className="space-y-8">
          <RoundView title="Round 1" round={data.round1} />

          {data.patches.map((p) => (
            <PatchView key={p.id} patch={p} />
          ))}

          <RoundView title="Round 2 — Rematch" round={data.round2} highlight="speedrunner" />

          <Improvement state={data.state} />
        </div>
      )}
    </main>
  );
}

function RoundView({ title, round, highlight }: { title: string; round: RoundResult; highlight?: string }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {round.runs.map((r) => {
          const win = r.agentId === round.winnerId;
          const evolved = r.agentId === highlight && r.result === "success";
          return (
            <div
              key={r.agentId}
              className={`rounded-xl border p-4 ${
                r.result === "success"
                  ? "border-arena-win/40 bg-arena-win/5"
                  : "border-arena-lose/40 bg-arena-lose/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{r.agentId}</span>
                <span className="text-sm tabular-nums">{r.score}/100</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className={r.result === "success" ? "text-arena-win" : "text-arena-lose"}>
                  {r.result === "success" ? "✓ SUCCESS" : "✗ FAIL"}
                </span>
                {win && <span className="rounded bg-arena-accent/20 px-1.5 text-arena-accent">WINNER</span>}
                {evolved && <span className="rounded bg-arena-win/20 px-1.5 text-arena-win">AGENT EVOLVED</span>}
              </div>
              <p className="mt-2 text-xs text-zinc-400">{r.failureReason ?? r.signalTrait}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PatchView({ patch }: { patch: SkillPatch }) {
  return (
    <section className="rounded-xl border border-arena-accent/40 bg-arena-accent/5 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-arena-accent">
        🧬 Skill Patch — Mutation Applied
      </h2>
      <p className="mt-2 text-sm">
        <span className="capitalize text-arena-win">{patch.sourceWinner}</span> →{" "}
        <span className="capitalize">{patch.targetAgents.join(", ")}</span>
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        <span className="text-zinc-500">Corrected:</span> {patch.failureCorrected}
      </p>
      <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-xs text-arena-win">
        + {patch.newSkillText}
      </pre>
    </section>
  );
}

function Improvement({ state }: { state: TournamentState }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Population Improved
      </h2>
      <div className="space-y-2">
        {state.agents.map((a) => {
          const [s1, s2] = a.scoreHistory;
          const delta = (s2 ?? 0) - (s1 ?? 0);
          return (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <span className="w-28 font-medium">{a.name}</span>
              <span className="tabular-nums text-zinc-400">
                {s1} → {s2}
              </span>
              {delta > 0 && <span className="text-arena-win">▲ +{delta}</span>}
              {delta === 0 && <span className="text-zinc-600">•</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
