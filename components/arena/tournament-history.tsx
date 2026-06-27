"use client";

import Link from "next/link";
import { History, Trophy, ArrowUpRight, Play, AlertTriangle } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import {
  agentScores,
  challengeCopy,
  hasRun,
  isComplete,
  roundByNumber,
  runForAgent,
  tournamentWinnerId,
} from "@/lib/arena/view";
import { BTN_PRIMARY, Panel, SectionTitle, Skeleton } from "./ui";
import type { ArenaStatus } from "./use-arena";

export type HistoryStatus = "completed" | "running" | "failed" | "interrupted";

export type TournamentHistoryItem = {
  id: string;
  name: string;
  status: HistoryStatus;
  winnerName: string | null;
  agentCount: number;
  patchCount: number;
  improvement: { name: string; delta: number } | null;
  timestamp: string | null; // ISO; null when the API doesn't expose one
  href: string;
};

// Derive history from real tournament state.
//
// TODO(api): the backend keeps a SINGLE in-memory tournament (lib/arena/store.ts:
// globalThis.__arena), so this derives at most ONE real entry — the current/
// most-recent run — and never fabricates rows. Long term we need persistent
// tournament history:
//
//   GET /api/arena/history → persisted tournament runs, each with a real:
//     - id              (stable, linkable)
//     - createdAt       (run-level timestamp; today we only have patch.appliedAt)
//     - status          (completed | running | failed | interrupted)
//     - winner          (agent id/name, or null)
//     - agentCount
//     - patchCount
//     - improvement     (top improver / summary)
//     - detail link data (so each row opens /tournaments/[id] with that run)
//
// This component already renders an array, so it lights up the moment that
// endpoint exists.
export function deriveHistory(state: TournamentState): TournamentHistoryItem[] {
  if (!hasRun(state)) return [];
  const r1 = roundByNumber(state, 1);
  const winnerId = tournamentWinnerId(state);
  const winnerRun = winnerId && r1 ? runForAgent(r1, winnerId) : undefined;
  const winnerName = winnerRun?.result === "success" ? state.agents.find((a) => a.id === winnerId)?.name ?? null : null;

  const improver =
    state.agents
      .map((a) => ({ name: a.name, delta: agentScores(state, a.id).improvement ?? 0 }))
      .filter((x) => x.delta > 0)
      .sort((a, b) => b.delta - a.delta)[0] ?? null;

  return [
    {
      id: state.taskId,
      name: challengeCopy(state.taskId).name,
      status: "completed", // GET /api/arena only reflects settled runs
      winnerName,
      agentCount: state.agents.length,
      patchCount: state.patches.length,
      improvement: improver,
      timestamp: state.patches[0]?.appliedAt ?? null, // TODO(api): no run-level timestamp; using first patch's appliedAt
      href: `/tournaments/${encodeURIComponent(state.taskId)}`,
    },
  ];
}

function relativeTime(iso: string): string {
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

const STATUS_BADGE: Record<HistoryStatus, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "border-arena-neon/45 text-arena-neon" },
  running: { label: "Running", cls: "border-arena-purpleBright/50 text-arena-purpleBright" },
  failed: { label: "Failed", cls: "border-arena-red/45 text-arena-red" },
  interrupted: { label: "Interrupted", cls: "border-arena-amber/45 text-arena-amber" },
};

export function TournamentStatusBadge({ status }: { status: HistoryStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function TournamentHistoryRow({ item }: { item: TournamentHistoryItem }) {
  return (
    <Link
      href={item.href}
      className="block rounded-xl border border-arena-border bg-arena-panel2/30 p-4 transition-colors hover:border-arena-purple/40 hover:bg-arena-panel2/50"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{item.name}</span>
            <TournamentStatusBadge status={item.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-arena-muted">
            {item.winnerName ? (
              <span className="inline-flex items-center gap-1">
                <Trophy size={12} className="text-arena-neon" />
                Winner: <span className="font-medium text-arena-neon">{item.winnerName}</span>
              </span>
            ) : (
              <span>No winner selected</span>
            )}
            <Dot />
            <span>{item.agentCount} agents</span>
            <Dot />
            <span>
              {item.patchCount} {item.patchCount === 1 ? "patch" : "patches"}
            </span>
            {item.improvement && (
              <>
                <Dot />
                <span className="text-arena-neon">
                  {item.improvement.name} +{item.improvement.delta}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
          {item.timestamp && <span className="text-[11px] tabular-nums text-arena-muted">{relativeTime(item.timestamp)}</span>}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-arena-purpleBright">
            View
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
export function TournamentHistory({
  state,
  status,
  error,
  onRetry,
  onRun,
  running,
}: {
  state?: TournamentState;
  status: ArenaStatus;
  error?: string | null;
  onRetry?: () => void;
  onRun?: () => void;
  running?: boolean;
}) {
  const items = state ? deriveHistory(state) : [];
  return (
    <Panel className="p-5">
      <SectionTitle icon={<History size={14} />}>Tournament History</SectionTitle>
      {status === "loading" && <HistoryLoadingState />}
      {status === "error" && <HistoryErrorState error={error} onRetry={onRetry} />}
      {(status === "empty" || (status === "ready" && items.length === 0)) && <HistoryEmptyState onRun={onRun} running={running} />}
      {status === "ready" && items.length > 0 && (
        <>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <TournamentHistoryRow key={item.id} item={item} />
            ))}
          </ul>
          {/* Honest note: one real run today; multi-run history needs a backend endpoint (see deriveHistory TODO). */}
          <p className="mt-3 text-[11px] text-arena-muted">
            Showing the current run. Persistent multi-run history will appear here once a history endpoint is available.
          </p>
        </>
      )}
    </Panel>
  );
}
