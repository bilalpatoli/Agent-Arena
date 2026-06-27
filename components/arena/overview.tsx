"use client";

import Link from "next/link";
import { Play, ArrowUpRight, Trophy, GitMerge, ShoppingCart, Radio } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import type { RunPhase } from "@/lib/arena/client";
import { useArena } from "./use-arena";
import { AgentActivity } from "./activity";
import { EmptyState, ErrorState, LoadingState, Panel, RunStatusBadge, SectionTitle, StatusBadge } from "./ui";
import { agentIcon } from "./ui";
import { agentStatus, challengeCopy, isComplete, patchedAgentIds, tournamentWinnerId } from "@/lib/arena/view";

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

      {/* Live per-agent activity feed during/after a run */}
      {liveRound && snapshot && <AgentActivity liveRound={liveRound} agents={snapshot.state.agents} />}

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "empty" && (
        <EmptyState
          title="No tournaments yet"
          body="Run your first arena to see agents compete on a real ecommerce checkout."
          action={
            <button
              onClick={run}
              disabled={running}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-arena-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Play size={15} />
              Run Tournament
            </button>
          }
        />
      )}

      {status === "ready" && snapshot && (
        <div className={`space-y-6 transition-opacity duration-300 ${running ? "opacity-50" : ""}`}>
          {/* Active / latest tournament */}
          <ActiveTournamentCard state={snapshot.state} phase={phase} running={running} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AgentPopulationSummary state={snapshot.state} />
            <LatestPatches state={snapshot.state} />
          </div>
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
  // Accurately label the run source: live Gemini calls vs replayed Gemini
  // captures vs the deterministic engine.
  const mode = live
    ? { label: "Live · Gemini", neon: true, live: true }
    : source === "gemini"
      ? { label: "Replay · Gemini", neon: true, live: false }
      : source
        ? { label: "Mock engine", neon: false, live: false }
        : { label: "Engine ready", neon: false, live: false };
  return (
    <header className="flex flex-col gap-4 border-b border-arena-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight xl:text-3xl">Agent Arena</h1>
        <p className="mt-1 text-sm text-arena-muted">Agents compete. Winners teach. Losers evolve.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {phase !== "idle" && <RunStatusBadge phase={phase} />}
        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${mode.neon ? "border-arena-neon/50 text-arena-neon" : "border-arena-border text-arena-muted"}`}>
          <Radio size={13} className={mode.live ? "pulse-soft" : ""} />
          {mode.label}
        </span>
        <Link
          href="/tournament"
          className="inline-flex items-center gap-1.5 rounded-lg border border-arena-border px-4 py-2 text-sm font-semibold text-arena-text hover:border-arena-purple/60"
        >
          View Latest Run
          <ArrowUpRight size={15} />
        </Link>
        <button
          onClick={onRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-arena-purple px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(139,92,246,0.9)] disabled:opacity-50"
        >
          <Play size={15} />
          {running ? "Running…" : "Run Tournament"}
        </button>
      </div>
    </header>
  );
}

function ActiveTournamentCard({
  state,
  phase,
  running,
}: {
  state: TournamentState;
  phase: RunPhase;
  running: boolean;
}) {
  const copy = challengeCopy(state.taskId);
  const winner = tournamentWinnerId(state);
  const winnerName = state.agents.find((a) => a.id === winner)?.name;
  const complete = isComplete(state);

  return (
    <Panel className="p-5" glow={complete}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-arena-purple/30 text-arena-purpleBright">
            <ShoppingCart size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{copy.name}</h2>
              {running ? <RunStatusBadge phase={phase} /> : <StatusBadge status={complete ? "winner" : "pending"} />}
            </div>
            <p className="mt-0.5 text-sm text-arena-muted">{copy.summary}</p>
            <p className="mt-1 text-xs text-arena-muted">
              Task: <span className="text-arena-text/80">{copy.task}</span>
            </p>
          </div>
        </div>
        <Link
          href="/tournament"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-arena-border px-3 py-1.5 text-sm font-medium text-arena-text hover:border-arena-purple/60"
        >
          Open
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
    <div className="rounded-lg border border-arena-border bg-arena-panel2/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-arena-muted">{label}</div>
      <div className={`mt-0.5 text-base font-bold ${accent ? "text-arena-neon" : "text-arena-text"}`}>{value}</div>
    </div>
  );
}

function AgentPopulationSummary({ state }: { state: TournamentState }) {
  return (
    <Panel className="p-4">
      <SectionTitle icon={<Trophy size={14} />}>Agent population</SectionTitle>
      <ul className="mt-3 space-y-2">
        {state.agents.map((a) => {
          const Icon = agentIcon(a.id);
          return (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-arena-border bg-arena-panel2/30 px-3 py-2">
              <span className="flex items-center gap-2.5">
                <Icon size={16} className="text-arena-purpleBright" />
                <span className="text-sm font-medium">{a.name}</span>
                <span className="text-xs text-arena-muted">{a.tagline}</span>
              </span>
              <StatusBadge status={agentStatus(state, a.id)} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function LatestPatches({ state }: { state: TournamentState }) {
  const patched = patchedAgentIds(state);
  return (
    <Panel className="p-4">
      <SectionTitle icon={<GitMerge size={14} />}>Latest skill patches</SectionTitle>
      {state.patches.length === 0 ? (
        <p className="mt-3 text-sm text-arena-muted">No skill patches generated yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {state.patches.map((p) => (
            <li key={p.id} className="rounded-lg border border-arena-border bg-arena-panel2/30 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-arena-neon">{state.agents.find((a) => a.id === p.sourceWinner)?.name ?? p.sourceWinner}</span>
                <GitMerge size={13} className="text-arena-muted" />
                <span className="font-medium text-arena-purpleBright">
                  {p.targetAgents.map((t) => state.agents.find((a) => a.id === t)?.name ?? t).join(", ")}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-arena-muted">{p.winningBehavior}</p>
            </li>
          ))}
        </ul>
      )}
      {patched.length > 0 && (
        <Link href="/patches" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-arena-purpleBright hover:underline">
          View all skill patches <ArrowUpRight size={12} />
        </Link>
      )}
    </Panel>
  );
}
