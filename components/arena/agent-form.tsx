"use client";

import { useState } from "react";
import { UserPlus, Check, Loader2, Wrench } from "lucide-react";
import { BEHAVIORS } from "@/lib/arena/view";
import { submitAgent, NOT_IMPLEMENTED } from "@/lib/arena/client";
import { Panel, SectionTitle } from "./ui";

type Phase = "idle" | "submitting" | "done" | "error" | "pending-backend";

// Predicted weakness from the capabilities the agent is missing — the same axes
// the engine scores on.
function weaknessHint(behaviors: Set<string>): string | null {
  if (!behaviors.has("scroll-full-page")) return "Likely jumps in without fully reproducing — may miss the real blocker.";
  if (!behaviors.has("verify-final-state")) return "Likely declares success early without verifying the real success state.";
  if (!behaviors.has("handle-modal")) return "May get stuck on a dialog or intermediate step.";
  if (!behaviors.has("fill-basic-form")) return "Can't reliably set the task up.";
  return null;
}

export function AgentSubmissionForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["fill-basic-form"]));
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const toggle = (tag: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(tag) ? n.delete(tag) : n.add(tag);
      return n;
    });

  const canSubmit = name.trim().length > 1 && selected.size > 0 && phase !== "submitting";
  const hint = weaknessHint(selected);

  async function submit() {
    setPhase("submitting");
    setError(null);
    try {
      await submitAgent({ name: name.trim(), strategy: strategy.trim(), behaviors: [...selected] });
      setPhase("done");
      setName("");
      setStrategy("");
      onAdded();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === NOT_IMPLEMENTED) setPhase("pending-backend");
      else {
        setError(msg);
        setPhase("error");
      }
    }
  }

  return (
    <Panel className="p-4">
      <SectionTitle icon={<UserPlus size={14} />}>Enter your own agent</SectionTitle>
      <p className="mt-1.5 text-sm text-arena-muted">
        Give it a name, a strategy, and the capabilities it has. It competes in the next tournament — and learns the winner&apos;s skills if it loses.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="Agent name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sentinel"
              className="w-full rounded-lg border border-arena-border bg-arena-panel2/40 px-3 py-2 text-sm outline-none focus:border-arena-purple/60"
            />
          </Field>
          <Field label="Strategy">
            <textarea
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              rows={3}
              placeholder="How does it approach the task?"
              className="w-full resize-none rounded-lg border border-arena-border bg-arena-panel2/40 px-3 py-2 text-sm outline-none focus:border-arena-purple/60"
            />
          </Field>
        </div>

        <Field label="Capabilities">
          <div className="space-y-1.5">
            {BEHAVIORS.map((b) => {
              const on = selected.has(b.tag);
              return (
                <button
                  key={b.tag}
                  type="button"
                  onClick={() => toggle(b.tag)}
                  className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                    on ? "border-arena-neon/50 bg-arena-neon/[0.06]" : "border-arena-border hover:border-arena-purple/40"
                  }`}
                >
                  <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? "border-arena-neon bg-arena-neon/20 text-arena-neon" : "border-arena-border"}`}>
                    {on && <Check size={11} />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-arena-text">{b.label}</span>
                    <span className="block text-xs text-arena-muted">{b.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {hint && (
        <p className="mt-3 text-xs text-arena-fail/90">
          <span className="font-semibold uppercase tracking-wide">Predicted weakness:</span> {hint}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-arena-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {phase === "submitting" ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
          Enter the arena
        </button>
        {phase === "done" && <span className="text-sm text-arena-neon">Agent added — run a tournament.</span>}
        {phase === "error" && <span className="font-mono text-xs text-arena-fail">{error}</span>}
      </div>

      {phase === "pending-backend" && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-arena-purpleBright/40 bg-arena-purple/[0.06] p-3 text-sm">
          <Wrench size={16} className="mt-0.5 shrink-0 text-arena-purpleBright" />
          <span className="text-arena-text/90">
            The <code className="font-mono text-xs text-arena-purpleBright">POST /api/arena/agents</code> endpoint isn&apos;t wired yet. The UI and
            contract are ready — see <span className="font-mono text-xs">docs/AGENT-SUBMISSION.md</span>. Once the engine supports it, this submits live.
          </span>
        </div>
      )}
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-arena-muted">{label}</span>
      {children}
    </label>
  );
}
