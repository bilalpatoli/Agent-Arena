"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// A controlled trap site for the Relay / Live demo. The obvious, prominent
// "Create your account" button is a DECOY → it lands on a celebratory "Account
// created!" page that looks like success but has NO dashboard and NO Account ID.
// The REAL path is a subtle secondary link → a short form → the real dashboard,
// which shows an "Account ID: ACC-48213".
//
// Goal given to the agent: reach the dashboard showing the Account ID. A first
// best-effort attempt clicks the big button and is fooled by the fake success;
// the lesson ("the big button is a decoy; use the classic signup link") makes
// the next attempt take the real path and succeed. Reliable, learnable, real.
// ─────────────────────────────────────────────────────────────────────────────

type Stage = "landing" | "fake" | "signup" | "dashboard";

export default function TrapPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (stage === "fake") {
    // Dead-end decoy: looks like success ("Account created!"), but there is no
    // dashboard, no Account ID, and no way forward — a fooled agent declares
    // success here and the judge fails it (no Account ID).
    return (
      <Shell>
        <div className="text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-3 text-3xl font-bold text-emerald-600">Account created!</h1>
          <p className="mt-2 text-zinc-500">Welcome aboard. You&apos;re all set.</p>
          <p className="mt-6 text-xs text-zinc-300">Nimbus · preview</p>
        </div>
      </Shell>
    );
  }

  if (stage === "signup") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-zinc-800">Classic signup</h1>
        <p className="mt-1 text-sm text-zinc-500">Create your real Nimbus account.</p>
        <label className="mt-5 block text-sm text-zinc-600">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
        <label className="mt-4 block text-sm text-zinc-600">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
        <button
          disabled={email.length < 3 || password.length < 3}
          onClick={() => setStage("dashboard")}
          className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white disabled:bg-zinc-300"
        >
          Complete signup
        </button>
      </Shell>
    );
  }

  if (stage === "dashboard") {
    return (
      <Shell>
        <div>
          <h1 data-testid="trap-dashboard" className="text-2xl font-bold text-zinc-900">
            Dashboard
          </h1>
          <p className="mt-1 text-zinc-500">Welcome to Nimbus.</p>
          <div className="mt-5 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
            <div className="text-xs uppercase tracking-wide text-emerald-700">Account ID</div>
            <div className="mt-0.5 text-lg font-bold text-emerald-800">ACC-48213</div>
          </div>
          <p className="mt-3 text-sm text-zinc-500">Your account is active. This is your real dashboard.</p>
        </div>
      </Shell>
    );
  }

  // landing
  return (
    <Shell>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900">Nimbus</h1>
        <p className="mt-2 text-zinc-500">Cloud analytics that just work.</p>
        {/* DECOY: the obvious primary CTA — looks like the way to sign up, but
            it leads to a fake "Account created!" page with no dashboard. */}
        <button
          onClick={() => setStage("fake")}
          className="mt-7 w-full rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg"
        >
          Create your account →
        </button>
        <p className="mt-3 text-xs text-zinc-400">No credit card required · 14-day trial</p>
      </div>
      {/* REAL path: subtle, easy to overlook. */}
      <p className="mt-8 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-400">
        Having trouble?{" "}
        <button onClick={() => setStage("signup")} className="text-zinc-500 underline">
          Use the classic signup form
        </button>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">{children}</div>
    </main>
  );
}
