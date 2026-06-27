"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchSnapshot,
  runTournament,
  type ArenaSnapshot,
  type RunPhase,
} from "@/lib/arena/client";
import { hasRun } from "@/lib/arena/view";

export type ArenaStatus = "loading" | "error" | "empty" | "ready";

export type UseArena = {
  snapshot: ArenaSnapshot | null;
  status: ArenaStatus;
  error: string | null;
  phase: RunPhase;
  running: boolean;
  run: () => Promise<void>;
  reload: () => Promise<void>;
};

// Single source of truth for arena data. Hits the real API; never falls back to
// synthetic data — failures surface as an honest error.
export function useArena(): UseArena {
  const [snapshot, setSnapshot] = useState<ArenaSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<RunPhase>("idle");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await fetchSnapshot());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = useCallback(async () => {
    setError(null);
    try {
      const snap = await runTournament(setPhase);
      setSnapshot(snap);
    } catch (e) {
      setPhase("failed");
      setError((e as Error).message);
    }
  }, []);

  const running = phase !== "idle" && phase !== "completed" && phase !== "failed";
  const status: ArenaStatus = loading
    ? "loading"
    : error
      ? "error"
      : snapshot && hasRun(snapshot.state)
        ? "ready"
        : "empty";

  return { snapshot, status, error, phase, running, run, reload };
}
