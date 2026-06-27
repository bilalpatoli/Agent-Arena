"use client";

import { useState } from "react";
import type { Run, RoundResult, SkillPatch, TournamentState, TraceStep } from "@/lib/arena/types";

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
        <h1 className="text-3xl font-bold tracking-tight">🏟 Agent Arena</h1>
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

          <RoundView
            title="Round 2 — Rematch"
            round={data.round2}
            evolved={data.patches.flatMap((p) => p.targetAgents)}
          />

          <Improvement state={data.state} />
        </div>
      )}
    </main>
  );
}

function RoundView({ title, round, evolved }: { title: string; round: RoundResult; evolved?: string[] }) {
  // Default to the winner's trace so the strongest run is visible first.
  const [selected, setSelected] = useState<string>(round.winnerId);
  const selectedRun = round.runs.find((r) => r.agentId === selected) ?? round.runs[0];

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {round.runs.map((r) => {
          const win = r.agentId === round.winnerId;
          const didEvolve = (evolved ?? []).includes(r.agentId) && r.result === "success";
          const isSel = r.agentId === selectedRun?.agentId;
          return (
            <button
              key={r.agentId}
              onClick={() => setSelected(r.agentId)}
              className={`rounded-xl border p-4 text-left transition ${
                r.result === "success"
                  ? "border-arena-win/40 bg-arena-win/5"
                  : "border-arena-lose/40 bg-arena-lose/5"
              } ${isSel ? "ring-2 ring-arena-accent/70" : "hover:border-zinc-500"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{r.agentId}</span>
                <span className="text-sm tabular-nums">{r.score}/100</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className={r.result === "success" ? "text-arena-win" : "text-arena-lose"}>
                  {r.result === "success" ? "✓ SUCCESS" : "✗ FAIL"}
                </span>
                {win && <span className="rounded bg-arena-accent/20 px-1.5 text-arena-accent">WINNER</span>}
                {didEvolve && <span className="rounded bg-arena-win/20 px-1.5 text-arena-win">AGENT EVOLVED</span>}
                <span className="ml-auto text-zinc-500">{r.steps.length} steps ›</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">{r.failureReason ?? r.signalTrait}</p>
            </button>
          );
        })}
      </div>

      {selectedRun && <TraceTimeline run={selectedRun} />}
    </section>
  );
}

function TraceTimeline({ run }: { run: Run }) {
  return (
    <div className="mt-3 rounded-xl border border-zinc-800 bg-arena-panel/60 p-4">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-widest text-zinc-400">
          Trace — <span className="capitalize text-zinc-200">{run.agentId}</span>
        </span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400">
          {run.source === "gemini" ? "live · gemini computer-use" : "mock"} · {run.durationMs}ms
        </span>
      </div>
      <ol className="space-y-0">
        {run.steps.map((s, i) => (
          <TraceRow key={i} step={s} last={i === run.steps.length - 1} />
        ))}
      </ol>
    </div>
  );
}

function TraceRow({ step, last }: { step: TraceStep; last: boolean }) {
  const isImage = step.screenshot?.startsWith("data:");
  return (
    <li className="flex gap-3">
      {/* rail */}
      <div className="flex flex-col items-center">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm ${
            step.ok ? "bg-arena-win/15 text-arena-win" : "bg-arena-lose/15 text-arena-lose"
          }`}
        >
          {stepIcon(step.action)}
        </span>
        {!last && <span className="my-0.5 w-px flex-1 bg-zinc-800" />}
      </div>
      {/* body */}
      <div className="flex flex-1 items-start gap-3 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              {step.action}
            </span>
            <span className={step.ok ? "text-zinc-300" : "text-arena-lose"}>{step.ok ? "✓" : "✗"}</span>
          </div>
          <p className="mt-1 text-sm text-zinc-300">{step.description}</p>
        </div>
        {isImage ? (
          <img
            src={step.screenshot}
            alt={step.action}
            className="h-16 w-24 shrink-0 rounded border border-zinc-700 object-cover object-top"
          />
        ) : step.screenshot ? (
          <span className="shrink-0 rounded border border-zinc-800 bg-black/40 px-2 py-1 font-mono text-[10px] text-zinc-500">
            {String(step.screenshot).split("/").pop()}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function stepIcon(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("navigate")) return "🧭";
  if (a.includes("type")) return "⌨️";
  if (a.includes("scroll")) return "↕";
  if (a.includes("click")) return "🖱";
  if (a.includes("verify")) return "✅";
  if (a.includes("halt")) return "⛔";
  if (a.includes("done")) return "🏁";
  return "•";
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
