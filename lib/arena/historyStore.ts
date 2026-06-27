import { promises as fs } from "fs";
import path from "path";
import type { TournamentState } from "./types";
import { agentScores, challengeCopy, roundByNumber, runForAgent, tournamentWinnerId } from "./view";

// ─────────────────────────────────────────────────────────────────────────────
// Durable tournament history — file-backed (one JSON per run under data/history).
// Deliberately the simplest pattern that survives a refresh and supports many
// runs. The shape is DB-ready: moving to Postgres/Supabase later means swapping
// these read/write helpers, not the API or UI.
//
// NOTE: server-only (uses fs). Imported by store.ts + route handlers, never by a
// client component.
// ─────────────────────────────────────────────────────────────────────────────

export type RunStatus = "queued" | "running" | "completed" | "failed" | "interrupted";

/** Full persisted run — the source of truth for both list + detail. */
export type PersistedRun = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RunStatus;
  challengeName: string;
  challengeType: string;
  task: string;
  failureReason?: string;
  state: TournamentState; // full state → powers the detail page
};

/** Lightweight row for the history list (derived from state, never fabricated). */
export type RunSummary = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  status: RunStatus;
  challengeName: string;
  challengeType: string;
  task: string;
  winnerAgentId: string | null;
  winnerAgentName: string | null;
  agentCount: number;
  patchCount: number;
  improvementSummary: {
    agentId: string;
    agentName: string;
    beforeScore: number;
    afterScore: number;
    delta: number;
  } | null;
};

// Storage dir is overridable (tests point it at a temp dir); read lazily so the
// override takes effect regardless of import order.
const dir = () => process.env.ARENA_HISTORY_DIR || path.join(process.cwd(), "data", "history");
const sanitize = (id: string) => id.replace(/[^a-zA-Z0-9._-]/g, "_");
const fileFor = (id: string) => path.join(dir(), `${sanitize(id)}.json`);

export function newRunId(taskId: string): string {
  return `${sanitize(taskId)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function ensureDir() {
  await fs.mkdir(dir(), { recursive: true });
}

export async function saveRun(run: PersistedRun): Promise<void> {
  await ensureDir();
  await fs.writeFile(fileFor(run.id), JSON.stringify(run), "utf8");
}

export async function getRun(id: string): Promise<PersistedRun | null> {
  try {
    return JSON.parse(await fs.readFile(fileFor(id), "utf8")) as PersistedRun;
  } catch {
    return null;
  }
}

export async function listRuns(): Promise<PersistedRun[]> {
  await ensureDir();
  let files: string[] = [];
  try {
    files = (await fs.readdir(dir())).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const runs = await Promise.all(
    files.map(async (f) => {
      try {
        return JSON.parse(await fs.readFile(path.join(dir(), f), "utf8")) as PersistedRun;
      } catch {
        return null;
      }
    }),
  );
  return (runs.filter(Boolean) as PersistedRun[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Create or update a persisted run. createdAt is preserved across updates so the
 * timeline is stable as a run progresses (start → rounds → complete/fail).
 */
export async function upsertRun(input: {
  id: string;
  status: RunStatus;
  state: TournamentState;
  failureReason?: string;
}): Promise<PersistedRun> {
  const now = new Date().toISOString();
  const existing = await getRun(input.id);
  const copy = challengeCopy(input.state.taskId);
  const record: PersistedRun = {
    id: input.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    status: input.status,
    challengeName: copy.name,
    challengeType: copy.name,
    task: copy.task,
    failureReason: input.failureReason ?? existing?.failureReason,
    state: input.state,
  };
  await saveRun(record);
  return record;
}

/** Derive a list-row summary from a persisted run — no invented data. */
export function toSummary(run: PersistedRun): RunSummary {
  const s = run.state;
  const r1 = roundByNumber(s, 1);
  const winnerId = tournamentWinnerId(s);
  const winnerRun = winnerId && r1 ? runForAgent(r1, winnerId) : undefined;
  const hasWinner = winnerRun?.result === "success";

  const improver =
    s.agents
      .map((a) => {
        const sc = agentScores(s, a.id);
        return { agentId: a.id, agentName: a.name, beforeScore: sc.round1 ?? 0, afterScore: sc.latest ?? 0, delta: sc.improvement ?? 0 };
      })
      .filter((x) => x.delta > 0)
      .sort((a, b) => b.delta - a.delta)[0] ?? null;

  return {
    id: run.id,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    status: run.status,
    challengeName: run.challengeName,
    challengeType: run.challengeType,
    task: run.task,
    winnerAgentId: hasWinner ? winnerId ?? null : null,
    winnerAgentName: hasWinner ? s.agents.find((a) => a.id === winnerId)?.name ?? null : null,
    agentCount: s.agents.length,
    patchCount: s.patches.length,
    improvementSummary: improver,
  };
}
