"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, RotateCw, ShoppingCart, Trophy } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import { challengeCopy, isComplete, tournamentWinnerId } from "@/lib/arena/view";
import { fetchTournament, type PersistedRun } from "@/lib/arena/client";
import { useArena } from "./use-arena";
import { BTN_PRIMARY, EmptyState, ErrorState, LoadingState, Panel, RunStatusBadge, SectionTitle } from "./ui";
import { TournamentStatusBadge } from "./tournament-history";
import { AgentCard } from "./agent-card";
import { ArenaBracket } from "./bracket";
import { SkillPatchViewer } from "./patch";
import { TraceInspector } from "./trace";
import { BeforeAfterComparison } from "./before-after";
import { PopulationImprovementTable } from "./population";

export function TournamentDetail() {
  const { snapshot, status, error, phase, running, run, reload } = useArena();

  if (status === "loading") return <LoadingState label="Loading tournament run…" />;
  if (status === "error") return <ErrorState error={error} onRetry={reload} />;
  if (status === "empty")
    return (
      <EmptyState
        title="No tournament run yet"
        body="Run a tournament to generate the full story: rounds, winner, skill patch, and rerun."
        action={
          <button onClick={run} disabled={running} className={`mt-1 ${BTN_PRIMARY}`}>
            <Play size={15} />
            Run Tournament
          </button>
        }
      />
    );

  const state = snapshot!.state;
  return (
    <div className="space-y-6">
      <DetailHeader state={state} phase={phase} running={running} onRun={run} />
      <DetailBody state={state} />
    </div>
  );
}

// Read-only detail for a PERSISTED run, loaded by id (GET /api/arena/tournaments/:id).
export function TournamentDetailById({ id }: { id: string }) {
  const [run, setRun] = useState<PersistedRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchTournament(id);
        if (alive) setRun(res.run);
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <LoadingState label="Loading tournament run…" />;
  if (error) return <ErrorState title="Could not load this tournament run" error={error} onRetry={() => location.reload()} />;
  if (!run) return <EmptyState title="Tournament run not found" body="This run is no longer available." />;

  const copy = challengeCopy(run.state.taskId);
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-arena-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="text-sm font-medium text-arena-purpleBright hover:underline">
              Arena
            </Link>
            <span className="text-arena-muted">/</span>
            <h1 className="text-2xl font-bold tracking-tight">{copy.name}</h1>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-arena-muted">
            {run.id} · saved {new Date(run.createdAt).toLocaleString()}
          </p>
        </div>
        <TournamentStatusBadge status={run.status} />
      </header>

      {run.failureReason && (
        <Panel className="border-arena-red/40 bg-arena-red/[0.05] p-4 text-sm text-arena-red">{run.failureReason}</Panel>
      )}

      <DetailBody state={run.state} />
    </div>
  );
}

// The full detail sections, rendered from any TournamentState (live or persisted).
function DetailBody({ state }: { state: TournamentState }) {
  return (
    <>
      <ChallengeSummary state={state} />

      <Section title="Agents competing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.agents.map((a) => (
            <AgentCard key={a.id} state={state} id={a.id} />
          ))}
        </div>
      </Section>

      <Section title="Round timeline">
        <RoundTimeline state={state} />
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkillPatchViewer state={state} />
        <PopulationImprovementTable state={state} />
      </div>

      <BeforeAfterComparison state={state} />
      <TraceInspector state={state} />
    </>
  );
}

function DetailHeader({
  state,
  phase,
  running,
  onRun,
}: {
  state: TournamentState;
  phase: ReturnType<typeof useArena>["phase"];
  running: boolean;
  onRun: () => void;
}) {
  const complete = isComplete(state);
  return (
    <header className="flex flex-col gap-4 border-b border-arena-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tournament run</h1>
        <p className="mt-1 text-sm text-arena-muted">{challengeCopy(state.taskId).name}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {phase !== "idle" && <RunStatusBadge phase={phase} />}
        <button onClick={onRun} disabled={running} className={BTN_PRIMARY}>
          {complete ? <RotateCw size={15} /> : <Play size={15} />}
          {running ? "Running…" : complete ? "Rerun Tournament" : "Run Tournament"}
        </button>
      </div>
    </header>
  );
}

function ChallengeSummary({ state }: { state: TournamentState }) {
  const copy = challengeCopy(state.taskId);
  return (
    <Panel className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-arena-purple/30 text-arena-purpleBright">
          <ShoppingCart size={22} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{copy.name}</h2>
          <p className="mt-0.5 text-sm text-arena-muted">{copy.summary}</p>
          <p className="mt-1.5 text-sm">
            <span className="text-arena-muted">Task:</span> {copy.task}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function RoundTimeline({ state }: { state: TournamentState }) {
  const [round, setRound] = useState<number>(state.rounds[0]?.round ?? 1);
  const winner = tournamentWinnerId(state);
  const winnerName = state.agents.find((a) => a.id === winner)?.name;

  return (
    <Panel className="arena-grid p-4">
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-arena-border p-0.5">
          {state.rounds.map((r) => (
            <button
              key={r.round}
              onClick={() => setRound(r.round)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${r.round === round ? "bg-arena-purple/20 text-arena-text" : "text-arena-muted hover:text-arena-text"}`}
            >
              Round {r.round}
            </button>
          ))}
        </div>
        {winnerName && (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Trophy size={15} className="text-arena-neon" />
            <span className="text-arena-muted">Winner</span>
            <span className="font-semibold text-arena-neon">{winnerName}</span>
          </span>
        )}
      </div>
      <div className="mt-3">
        <ArenaBracket state={state} round={round} />
      </div>
    </Panel>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}
