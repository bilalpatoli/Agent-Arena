"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// The challenge environment: "FlowMetrics" fake SaaS signup, loaded with traps.
//  - required checkbox hidden far below the fold
//  - submit disabled until checkbox checked
//  - misleading fake CTA ("Get Started Free")
//  - confirmation modal after submit
//  - real dashboard success state that must be verified
// This is the page a live Gemini 3.5 computer-use agent drives.
// ─────────────────────────────────────────────────────────────────────────────

export default function ChallengePage() {
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [stage, setStage] = useState<"form" | "dashboard">("form");

  const canSubmit = agreed && email.length > 3 && password.length > 3;

  if (stage === "dashboard") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-center">
        <h1 data-testid="dashboard-heading" className="text-3xl font-bold text-emerald-400">
          Welcome to FlowMetrics
        </h1>
        <p className="text-zinc-400">Your dashboard is ready. Account created successfully.</p>
        <span className="rounded bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
          /dashboard · authenticated
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero with the misleading fake CTA */}
      <section className="border-b border-zinc-800 px-6 py-16 text-center">
        <h1 className="text-4xl font-bold">FlowMetrics</h1>
        <p className="mt-2 text-zinc-400">Analytics that actually make sense.</p>
        {/* DECOY: looks like the way forward, but does nothing real */}
        <button
          onClick={() => alert("🪤 Fake CTA — this doesn't create an account.")}
          className="mt-6 rounded-lg bg-fuchsia-600 px-6 py-3 font-semibold"
        >
          Get Started Free →
        </button>
      </section>

      {/* Real signup form */}
      <section className="mx-auto max-w-md px-6 py-12">
        <h2 className="mb-6 text-xl font-semibold">Create your account</h2>
        <label className="block text-sm text-zinc-400">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
          placeholder="you@company.com"
        />
        <label className="mt-4 block text-sm text-zinc-400">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
          placeholder="••••••••"
        />

        {/* Spacer pushes the required checkbox far below the fold */}
        <div aria-hidden className="h-[900px]" />

        <div className="flex items-start gap-2">
          <input
            id="agree"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="agree" className="text-sm text-zinc-400">
            I agree to the Terms of Service. <span className="text-rose-400">(required)</span>
          </label>
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => setShowModal(true)}
          className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 font-semibold disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          Create account
        </button>
        {!agreed && (
          <p className="mt-2 text-xs text-zinc-600">
            Submit stays disabled until the required box above is checked.
          </p>
        )}
      </section>

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="w-80 rounded-xl border border-zinc-700 bg-zinc-900 p-5">
            <h3 className="font-semibold">Confirm your details</h3>
            <p className="mt-1 text-sm text-zinc-400">Create an account for {email}?</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setStage("dashboard");
                }}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
