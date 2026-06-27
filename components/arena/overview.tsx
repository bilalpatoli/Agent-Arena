"use client";

import Link from "next/link";
import { Play, ArrowUpRight, ArrowRight, GitMerge, ShoppingCart, Radio } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import type { RunPhase } from "@/lib/arena/client";
import { useArena } from "./use-arena";
import { AgentActivity } from "./activity";
import { AgentCard } from "./agent-card";
import { TournamentHistory } from "./tournament-history";
import { BTN_PRIMARY, BTN_SECONDARY, ErrorState, LoadingState, Panel, RunStatusBadge, SectionTitle, StatusBadge } from "./ui";
import { challengeCopy, isComplete, patchedAgentIds, tournamentWinnerId } from "@/lib/arena/view";

export function TournamentOverview() {
  const { snapshot, status, error, phase, running, liveRound, run, reload } = useArena();

  return (
    <div className="space-y-6">
      <ArenaHeader
        running={running}
        phase={phase}
        onRun={run}
        live={snapshot?.live}
        source={snapshot?.state.rounds[0]?.runs[0]?.source}
      />

      {liveRound && snapshot && <AgentActivity liveRound={liveRound} agents={snapshot.state.agents} />}

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "empty" && <TournamentHistory status="empty" onRun={run} running={running} />}

      {status === "ready" && snapshot && (
        <div className={`space-y-6 transition-opacity duration-300 ${running ? "pointer-events-none opacity-50" : ""}`}>
          <ActiveTournamentCard state={snapshot.state} phase={phase} running={running} />

          <section className="space-y-3">
            <SectionTitle>Standings</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.state.agents.map((a) => (
                <AgentCard key={a.id} state={snapshot.state} id={a.id} />
              ))}
            </div>
          </section>

          <TournamentHistory state={snapshot.state} status={status} error={error} onRetry={reload} onRun={run} running={running} />

          <LatestPatches state={snapshot.state} />
        </div>
      )}
    </div>
  );
}

function ArenaHeader({
  running,
  phase,
  onRun,
  live,
  source,
}: {
  running: boolean;
  phase: RunPhase;
  onRun: () => void;
  live?: boolean;
  source?: string;
}) {
  const mode = live
    ? { label: "Live · Gemini", neon: true, live: true }
    : source === "gemini"
      ? { label: "Replay · Gemini", neon: true, live: false }
      : source
        ? { label: "Mock engine", neon: false, live: false }
        : { label: "Engine ready", neon: false, live: false };

  return (
    <header className="flex flex-col gap-4 border-b border-arena-border pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight xl:text-3xl">Agent Arena</h1>
        <p className="mt-1 text-sm text-arena-muted">Agents compete. Winners teach. Losers evolve.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {phase !== "idle" && <RunStatusBadge phase={phase} />}
        <span
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold uppercase tracking-wide ${
            mode.neon ? "border-arena-neon/40 text-arena-neon" : "border-arena-border text-arena-muted"
          }`}
        >
          <Radio size={13} className={mode.live ? "pulse-soft" : ""} />
          {mode.label}
        </span>
        <Link href="/tournament" className={BTN_SECONDARY}>
          View Latest Run
          <ArrowUpRight size={15} />
        </Link>
        <button onClick={onRun} disabled={running} className={BTN_PRIMARY}>
          <Play size={15} />
          {running ? "Running…" : "Run Tournament"}
        </button>
      </div>
    </header>
  );
}

function ActiveTournamentCard({ state, phase, running }: { state: TournamentState; phase: RunPhase; running: boolean }) {
  const copy = challengeCopy(state.taskId);
  const winnerName = state.agents.find((a) => a.id === tournamentWinnerId(state))?.name;
  const complete = isComplete(state);

  return (
    <Panel className="p-5 sm:p-6" glow={complete}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-arena-purple/30 text-arena-purpleBright">
            <ShoppingCart size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{copy.name}</h2>
              {running ? <RunStatusBadge phase={phase} /> : <StatusBadge status={complete ? "winner" : "pending"} />}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-arena-muted">{copy.summary}</p>
            <p className="mt-1.5 text-xs text-arena-muted">
              Task: <span className="text-arena-text/80">{copy.task}</span>
            </p>
          </div>
        </div>
        <Link href="/tournament" className={`shrink-0 self-start ${BTN_SECONDARY}`}>
          Open
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Rounds" value={String(state.rounds.length)} />
        <Metric label="Agents" value={String(state.agents.length)} />
        <Metric label="Winner" value={winnerName ?? "—"} accent />
        <Metric label="Skill patches" value={String(state.patches.length)} />
      </div>
    </Panel>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-arena-border bg-arena-panel2/40 px-3.5 py-3">
      <div className="text-[10px] uppercase tracking-wider text-arena-muted">{label}</div>
      <div className={`mt-1 truncate text-lg font-bold ${accent ? "text-arena-neon" : "text-arena-text"}`}>{value}</div>
    </div>
  );
}

function LatestPatches({ state }: { state: TournamentState }) {
  const patched = patchedAgentIds(state);
  const nameFor = (id: string) => state.agents.find((a) => a.id === id)?.name ?? id;

  return (
    <Panel className="p-5">
      <SectionTitle
        icon={<GitMerge size={14} />}
        right={
          patched.length > 0 ? (
            <Link href="/patches" className="inline-flex items-center gap-1 text-xs font-medium text-arena-purpleBright hover:underline">
              View all <ArrowUpRight size={12} />
            </Link>
          ) : undefined
        }
      >
        Latest skill patches
      </SectionTitle>

      {state.patches.length === 0 ? (
        <p className="mt-4 text-sm text-arena-muted">No skill patches generated yet.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {state.patches.map((p) => (
            <li key={p.id} className="rounded-xl border border-arena-border bg-arena-panel2/30 p-3.5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-arena-neon">{nameFor(p.sourceWinner)}</span>
                <ArrowRight size={14} className="text-arena-muted" />
                <span className="font-medium text-arena-purpleBright">{p.targetAgents.map(nameFor).join(", ")}</span>
                <span className="ml-auto text-[11px] text-arena-muted">round {p.round}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-arena-muted">{p.winningBehavior}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
