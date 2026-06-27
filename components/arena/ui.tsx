"use client";

import {
  Network,
  Compass,
  Trophy,
  AlertTriangle,
  Inbox,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type { AgentStatus } from "@/lib/arena/view";
import type { RunPhase } from "@/lib/arena/client";
import { PHASE_LABEL } from "@/lib/arena/client";

export const AGENT_ICON: Record<string, LucideIcon> = {
  planner: Network,
  explorer: Compass,
  verifier: Trophy,
};
export const agentIcon = (id: string): LucideIcon => AGENT_ICON[id] ?? Network;

// Status → presentation. Neon green only for winning/success; purple for the
// learning/improvement story; soft purple-pink for failure.
export const STATUS_META: Record<AgentStatus, { label: string; cls: string; dot: string }> = {
  winner: { label: "Winner", cls: "border-arena-neon/60 text-arena-neon", dot: "bg-arena-neon" },
  improved: { label: "Improved after patch", cls: "border-arena-purpleBright/60 text-arena-purpleBright", dot: "bg-arena-purpleBright" },
  success: { label: "Success", cls: "border-arena-neon/60 text-arena-neon", dot: "bg-arena-neon" },
  failed: { label: "Failed", cls: "border-arena-fail/50 text-arena-fail", dot: "bg-arena-fail" },
  pending: { label: "Pending", cls: "border-arena-border text-arena-muted", dot: "bg-arena-muted" },
};

export function StatusBadge({ status, className = "" }: { status: AgentStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${m.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const RUN_PHASE_TONE: Record<RunPhase, string> = {
  idle: "border-arena-border text-arena-muted",
  queued: "border-arena-border text-arena-muted",
  "running-round-1": "border-arena-purpleBright/60 text-arena-purpleBright",
  evaluating: "border-arena-purpleBright/60 text-arena-purpleBright",
  patching: "border-arena-purpleBright/60 text-arena-purpleBright",
  "running-round-2": "border-arena-purpleBright/60 text-arena-purpleBright",
  completed: "border-arena-neon/60 text-arena-neon",
  failed: "border-arena-fail/60 text-arena-fail",
};

export function RunStatusBadge({ phase }: { phase: RunPhase }) {
  const busy = phase !== "idle" && phase !== "completed" && phase !== "failed";
  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${RUN_PHASE_TONE[phase]}`}>
      {busy ? <Loader2 size={13} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {PHASE_LABEL[phase]}
    </span>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function Panel({
  children,
  className = "",
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section className={`rounded-xl border bg-arena-panel ${glow ? "border-arena-neon/50 glow-neon" : "border-arena-border"} ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ icon, children, right }: { icon?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-arena-muted">
        {icon}
        {children}
      </div>
      {right}
    </div>
  );
}

// ── State components ──────────────────────────────────────────────────────────
export function LoadingState({ label = "Loading arena…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <div className="flex items-center gap-2 text-sm text-arena-muted">
        <Loader2 size={16} className="animate-spin" />
        {label}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border border-arena-border bg-arena-panel2/60 ${className}`} />;
}

export function ErrorState({ error, onRetry, title = "Could not load tournament run" }: { error?: string | null; onRetry?: () => void; title?: string }) {
  return (
    <Panel className="flex flex-col items-center gap-3 p-10 text-center">
      <AlertTriangle className="text-arena-fail" size={28} />
      <div className="text-base font-semibold text-arena-text">{title}</div>
      {error && <p className="max-w-md font-mono text-xs text-arena-muted">{error}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-lg border border-arena-border px-4 py-2 text-sm font-semibold text-arena-text hover:border-arena-purple/60"
        >
          Try again
        </button>
      )}
    </Panel>
  );
}

export function EmptyState({
  title = "No tournaments yet",
  body = "Run your first arena.",
  action,
}: {
  title?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col items-center gap-3 p-12 text-center">
      <Inbox className="text-arena-muted" size={28} />
      <div className="text-base font-semibold text-arena-text">{title}</div>
      <p className="max-w-sm text-sm text-arena-muted">{body}</p>
      {action}
    </Panel>
  );
}

export function NotAvailable() {
  return <span className="text-arena-muted">Not available</span>;
}
