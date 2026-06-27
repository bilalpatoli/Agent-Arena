"use client";

import Link from "next/link";
import { ArrowUpRight, Trophy, Settings as SettingsIcon, Play } from "lucide-react";
import { useArena } from "./use-arena";
import { EmptyState, ErrorState, LoadingState, Panel, SectionTitle, StatusBadge } from "./ui";
import { AgentCard } from "./agent-card";
import { SkillPatchViewer } from "./patch";
import { challengeCopy, isComplete, tournamentWinnerId } from "@/lib/arena/view";

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="border-b border-arena-border pb-5">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-arena-muted">{subtitle}</p>
    </header>
  );
}

const runCta = (run: () => void, running: boolean) => (
  <button
    onClick={run}
    disabled={running}
    className="mt-1 inline-flex items-center gap-2 rounded-lg bg-arena-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
  >
    <Play size={15} />
    Run Tournament
  </button>
);

export function AgentsView() {
  const { snapshot, status, error, running, run, reload } = useArena();
  return (
    <div className="space-y-6">
      <PageHeader title="Agents" subtitle="The competing agent population and how each one is performing." />
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "empty" && <EmptyState title="No agents yet" body="Run a tournament to populate the roster." action={runCta(run, running)} />}
      {status === "ready" && snapshot && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.state.agents.map((a) => (
            <AgentCard key={a.id} state={snapshot.state} id={a.id} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PatchesView() {
  const { snapshot, status, error, running, run, reload } = useArena();
  return (
    <div className="space-y-6">
      <PageHeader title="Skill Patches" subtitle="Behaviors transferred from winning agents to the rest of the population." />
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "empty" && <EmptyState title="No skill patches yet" body="Run a tournament to generate skill patches." action={runCta(run, running)} />}
      {status === "ready" && snapshot && (
        snapshot.state.patches.length === 0 ? (
          <EmptyState title="No skill patches yet" body="This run hasn't produced a skill patch." action={runCta(run, running)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {snapshot.state.patches.map((p) => (
              <SkillPatchViewer key={p.id} state={snapshot.state} patch={p} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export function TournamentsView() {
  const { snapshot, status, error, running, run, reload } = useArena();
  return (
    <div className="space-y-6">
      <PageHeader title="Tournaments" subtitle="Active and completed tournament runs." />
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "empty" && <EmptyState title="No tournaments yet" body="Run your first arena." action={runCta(run, running)} />}
      {status === "ready" && snapshot && (
        <>
          <Panel className="p-5" glow={isComplete(snapshot.state)}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-arena-purple/30 text-arena-purpleBright">
                  <Trophy size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{challengeCopy(snapshot.state.taskId).name}</span>
                    <StatusBadge status={isComplete(snapshot.state) ? "winner" : "pending"} />
                  </div>
                  <p className="text-xs text-arena-muted">
                    {snapshot.state.rounds.length} round(s) · winner{" "}
                    {snapshot.state.agents.find((a) => a.id === tournamentWinnerId(snapshot.state))?.name ?? "—"}
                  </p>
                </div>
              </div>
              <Link href="/tournament" className="inline-flex items-center gap-1.5 rounded-lg border border-arena-border px-3 py-1.5 text-sm font-medium hover:border-arena-purple/60">
                Open <ArrowUpRight size={14} />
              </Link>
            </div>
          </Panel>
          <p className="text-xs text-arena-muted">
            {/* TODO(api): the backend keeps a single in-memory tournament; a history endpoint would populate a full list here. */}
            Showing the current tournament. Run history requires a backend tournaments endpoint.
          </p>
        </>
      )}
    </div>
  );
}

export function SettingsView() {
  const { snapshot, status } = useArena();
  const roster = snapshot?.state.agents.map((a) => a.name).join(", ");
  const challenge = snapshot ? challengeCopy(snapshot.state.taskId).name : undefined;
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Runtime configuration for the arena." />
      <Panel className="p-4">
        <SectionTitle icon={<SettingsIcon size={14} />}>Runtime</SectionTitle>
        <dl className="mt-3 space-y-2.5 text-sm">
          <Row term="Agent runner" desc={status === "loading" ? "…" : snapshot?.live ? "Gemini computer use (live)" : "Deterministic engine"} />
          <Row term="Roster" desc={roster ?? "—"} />
          <Row term="Challenge" desc={challenge ?? "—"} />
        </dl>
        <p className="mt-3 text-xs text-arena-muted">
          {/* TODO(api): expose editable settings (model, roster, challenge) via the API. */}
          Runner credentials and model selection are configured server-side via environment variables.
        </p>
      </Panel>
    </div>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex items-center justify-between border-b border-arena-border pb-2 last:border-0">
      <dt className="text-arena-muted">{term}</dt>
      <dd className="text-arena-text/90">{desc}</dd>
    </div>
  );
}
