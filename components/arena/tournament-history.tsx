"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { History, Trophy, ArrowUpRight, Play, AlertTriangle } from "lucide-react";
import { fetchHistory, type RunSummary } from "@/lib/arena/client";
import type { RunStatus } from "@/lib/arena/historyStore";
import { BTN_PRIMARY, Panel, SectionTitle, Skeleton } from "./ui";

const STATUS_BADGE: Record<RunStatus, { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "border-arena-border text-arena-muted" },
  running: { label: "Running", cls: "border-arena-purpleBright/50 text-arena-purpleBright" },
  completed: { label: "Completed", cls: "border-arena-neon/45 text-arena-neon" },
  failed: { label: "Failed", cls: "border-arena-red/45 text-arena-red" },
  interrupted: { label: "Interrupted", cls: "border-arena-amber/45 text-arena-amber" },
};

export function TournamentStatusBadge({ status }: { status: RunStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function TournamentHistoryRow({ run }: { run: RunSummary }) {
  const failed = run.status === "failed";
  return (
    <Link
      href={`/tournaments/${encodeURIComponent(run.id)}`}
      className="block rounded-xl border border-arena-border bg-arena-panel2/30 p-4 transition-colors hover:border-arena-purple/40 hover:bg-arena-panel2/50"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{run.challengeName}</span>
            <TournamentStatusBadge status={run.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-arena-muted">
            {failed ? (
              <span className="text-arena-red">{run.task ? `Live engine unavailable` : "Run failed"}</span>
            ) : run.winnerAgentName ? (
              <span className="inline-flex items-center gap-1">
                <Trophy size={12} className="text-arena-neon" />
                Winner: <span className="font-medium text-arena-neon">{run.winnerAgentName}</span>
              </span>
            ) : (
              <span>No winner selected</span>
            )}
            <Dot />
            <span>{run.agentCount} agents</span>
            <Dot />
            <span>
              {run.patchCount} {run.patchCount === 1 ? "patch" : "patches"}
            </span>
            {run.improvementSummary && run.improvementSummary.delta > 0 && (
              <>
                <Dot />
                <span className="text-arena-neon">
                  {run.improvementSummary.agentName} +{run.improvementSummary.delta}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
          <span className="text-[11px] tabular-nums text-arena-muted">{relativeTime(run.createdAt)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-arena-purpleBright">
            {failed ? "View details" : "View"}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Dot() {
  return <span className="text-arena-border">·</span>;
}

// ── States ────────────────────────────────────────────────────────────────────
export function HistoryLoadingState() {
  return (
    <div className="mt-4 space-y-3">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-[68px]" />
      ))}
    </div>
  );
}

export function HistoryEmptyState({ onRun, running }: { onRun?: () => void; running?: boolean }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-arena-border py-10 text-center">
      <History className="text-arena-muted" size={24} />
      <div className="text-sm font-semibold">No tournament history yet</div>
      <p className="max-w-sm text-sm text-arena-muted">Run your first arena to start building agent evolution history.</p>
      {onRun && (
        <button onClick={onRun} disabled={running} className={`mt-1 ${BTN_PRIMARY}`}>
          <Play size={15} />
          Run Tournament
        </button>
      )}
    </div>
  );
}

export function HistoryErrorState({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2.5 rounded-xl border border-arena-red/40 bg-arena-red/[0.05] py-8 text-center">
      <AlertTriangle className="text-arena-red" size={22} />
      <div className="text-sm font-semibold">Could not load tournament history</div>
      {error && <p className="max-w-md font-mono text-xs text-arena-red/90">{error}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-1 rounded-lg border border-arena-border px-4 py-2 text-sm font-semibold hover:border-arena-purple/60">
          Try again
        </button>
      )}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
// Driven entirely by the persisted-history endpoint (GET /api/arena/history) —
// real saved runs, never derived/fabricated. Re-fetches when a run finishes.
export function TournamentHistory({ onRun, running }: { onRun?: () => void; running?: boolean }) {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRuns((await fetchHistory()).runs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when a run transitions from running → done, so the new run shows up.
  const wasRunning = useRef(running);
  useEffect(() => {
    if (wasRunning.current && !running) load();
    wasRunning.current = running;
  }, [running, load]);

  return (
    <Panel className="p-5">
      <SectionTitle icon={<History size={14} />}>Tournament History</SectionTitle>
      {loading && runs === null && <HistoryLoadingState />}
      {error && <HistoryErrorState error={error} onRetry={load} />}
      {!error && runs !== null && runs.length === 0 && <HistoryEmptyState onRun={onRun} running={running} />}
      {!error && runs !== null && runs.length > 0 && (
        <ul className="mt-4 space-y-3">
          {runs.map((run) => (
            <TournamentHistoryRow key={run.id} run={run} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
