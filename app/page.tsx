"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Network,
  Compass,
  Trophy,
  Crosshair,
  RefreshCw,
  Dna,
  FileCode2,
  User,
  Users,
  ShieldCheck,
  History,
  Globe,
  PenLine,
  EyeOff,
  CheckSquare,
  XCircle,
  MonitorCheck,
  CheckCircle2,
  TrendingUp,
  Swords,
  ChevronsRight,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { ArenaLogo } from "@/components/ArenaLogo";
import type { Run, RoundResult, TraceStep } from "@/lib/arena/types";
import { FALLBACK_DEMO, type DemoResponse } from "@/lib/arena/fallback";

// ─────────────────────────────────────────────────────────────────────────────
// Agent Arena — single-screen tournament dashboard (Role 1, demo experience).
// Data-driven: on mount it runs a REAL tournament via POST /api/arena/demo and
// renders the result. If that ever fails, it falls back to a captured real run
// (lib/arena/fallback.ts) so the demo can't break. Rematch toggles Round 1 → 2.
// ─────────────────────────────────────────────────────────────────────────────

type Status = "fail" | "winner" | "success";

const META: Record<string, { name: string; Icon: LucideIcon; strategy: string }> = {
  planner: { name: "Planner", Icon: Network, strategy: "Methodical, low exploration" },
  explorer: { name: "Explorer", Icon: Compass, strategy: "Fast, risky clicks" },
  verifier: { name: "Verifier", Icon: Trophy, strategy: "Checks final success state" },
};
const ORDER = ["planner", "explorer", "verifier"];

// ── data derivation ───────────────────────────────────────────────────────────
const roundOf = (d: DemoResponse, r: 1 | 2): RoundResult => (r === 1 ? d.round1 : d.round2);
const runOf = (d: DemoResponse, r: 1 | 2, id: string): Run =>
  roundOf(d, r).runs.find((x) => x.agentId === id)!;
function statusOf(d: DemoResponse, r: 1 | 2, id: string): Status {
  const rd = roundOf(d, r);
  const run = runOf(d, r, id);
  if (run.result !== "success") return "fail";
  return id === rd.winnerId ? "winner" : "success";
}
const isWin = (s: Status) => s === "winner" || s === "success";

export default function ArenaDashboard() {
  const [demo, setDemo] = useState<DemoResponse>(FALLBACK_DEMO);
  const [live, setLive] = useState(false);
  const [round, setRound] = useState<1 | 2>(1);

  // Run a real tournament on mount; keep the fallback if anything goes wrong.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/arena/demo", { method: "POST" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as DemoResponse;
        if (!json?.round1?.runs?.length) throw new Error("empty");
        if (alive) {
          setDemo(json);
          setLive(true);
        }
      } catch {
        /* keep FALLBACK_DEMO — demo stays safe */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const source = demo.round1.runs[0]?.source;

  return (
    <main className="min-h-screen px-5 py-4 xl:px-7">
      <Header round={round} live={live} source={source} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left zone */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ORDER.map((id) => (
              <AgentCard
                key={id}
                id={id}
                score={runOf(demo, round, id).score}
                status={statusOf(demo, round, id)}
              />
            ))}
          </div>
          <BracketPanel demo={demo} round={round} />
          <TraceReplayPanel demo={demo} />
        </div>

        {/* Right zone */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <SkillMutationPanel demo={demo} />
          <MetaPanel demo={demo} />
          <PopulationPanel demo={demo} round={round} onRematch={() => setRound((r) => (r === 1 ? 2 : 1))} />
        </div>
      </div>
    </main>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ round, live, source }: { round: 1 | 2; live: boolean; source?: string }) {
  const label = !live ? "DEMO · fallback" : source === "gemini" ? "LIVE · Gemini" : "LIVE · engine";
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ArenaLogo size={46} />
        <div>
          <h1 className="text-2xl font-black tracking-[0.08em] xl:text-3xl">AGENT ARENA</h1>
          <p className="text-xs text-arena-muted">Agents compete. Winners teach. Losers evolve.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${
            live ? "border-arena-neon/50 text-arena-neon" : "border-arena-border text-arena-muted"
          }`}
        >
          <Radio size={14} className={live ? "pulse-soft" : ""} />
          {label}
        </span>
        <Pill icon={<Crosshair size={15} className="text-arena-purpleBright" />}>
          Challenge: <span className="font-semibold text-arena-text">SaaS Signup</span>
        </Pill>
        <Pill icon={<RefreshCw size={15} className="text-arena-purpleBright" />}>
          <span className="font-semibold text-arena-text">Round {round} / 2</span>
        </Pill>
      </div>
    </header>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-xl border border-arena-border bg-arena-panel px-4 py-2.5 text-sm text-arena-muted">
      {icon}
      {children}
    </span>
  );
}

// ── Agent cards ───────────────────────────────────────────────────────────────
function AgentCard({ id, score, status }: { id: string; score: number; status: Status }) {
  const meta = META[id];
  const win = isWin(status);
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative rounded-2xl border bg-arena-panel p-4 transition-shadow ${
        win ? "border-arena-neon/60 glow-neon" : "border-arena-purple/35"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Hexicon Icon={meta.Icon} win={win} />
          <div>
            <div className="text-lg font-bold leading-tight">{meta.name}</div>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="text-right">
          <AnimatedNumber
            value={score}
            className={`text-3xl font-black tabular-nums leading-none ${win ? "text-arena-neon text-glow-neon" : "text-arena-text"}`}
          />
          <div className="text-[10px] font-semibold uppercase tracking-widest text-arena-muted">Score</div>
        </div>
      </div>
      <div className="mt-3 border-t border-arena-border pt-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-arena-muted">Strategy</div>
        <p className="mt-0.5 text-sm text-arena-text/85">{meta.strategy}</p>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string; icon: string }> = {
    fail: { label: "Failed", cls: "border-arena-fail/50 text-arena-fail", icon: "✕" },
    success: { label: "Success", cls: "border-arena-neon/60 text-arena-neon", icon: "✓" },
    winner: { label: "Winner", cls: "border-arena-neon/70 text-arena-neon", icon: "✓" },
  };
  const s = map[status];
  return (
    <span className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${s.cls}`}>
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

function Hexicon({ Icon, win, size = 44 }: { Icon: LucideIcon; win: boolean; size?: number }) {
  const color = win ? "#7cff57" : "#a78bfa";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <polygon
          points="50,4 91,27 91,73 50,96 9,73 9,27"
          fill={win ? "rgba(124,255,87,0.08)" : "rgba(139,92,246,0.07)"}
          stroke={color}
          strokeWidth="4"
        />
      </svg>
      <Icon size={size * 0.42} style={{ color }} />
    </div>
  );
}

// ── Center bracket (the hero) ─────────────────────────────────────────────────
const VB = { w: 640, h: 330 };
const pct = (n: number, total: number) => `${(n / total) * 100}%`;

function BracketPanel({ demo, round }: { demo: DemoResponse; round: 1 | 2 }) {
  const won = (id: string) => isWin(statusOf(demo, round, id));
  const P = "#5b4d82";
  const G = "#7cff57";
  const col = (id: string) => (won(id) ? G : P);

  return (
    <Panel className="arena-grid relative overflow-hidden p-4">
      <span className="absolute left-4 top-4 z-10 rounded-md border border-arena-border bg-arena-panel2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-arena-muted">
        Round {round}
      </span>

      <div className="absolute right-5 top-[24%] z-10 max-w-[180px] rounded-lg border border-arena-neon/40 bg-arena-neon/[0.06] px-3 py-2 text-xs leading-snug text-arena-neon">
        Scanned full page + verified success state
      </div>

      <div className="relative aspect-[640/330] w-full">
        <svg viewBox="0 0 640 330" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
          <BracketPath d="M110 226 C110 176 232 190 318 102" color={col("planner")} flow={won("planner")} />
          <BracketPath d="M320 226 L320 100" color={col("explorer")} flow={won("explorer")} />
          <BracketPath d="M530 226 C530 176 408 190 322 102" color={col("verifier")} flow={won("verifier")} />
          <Diamond x={212} y={183} on={won("planner")} />
          <Diamond x={428} y={183} on={won("verifier")} />
        </svg>

        <NodeBadge left={pct(320, VB.w)} top={pct(78, VB.h)} Icon={Trophy} win label="Winner" pulse />
        <NodeBadge left={pct(110, VB.w)} top={pct(250, VB.h)} Icon={Network} win={won("planner")} label="Planner" score={runOf(demo, round, "planner").score} />
        <NodeBadge left={pct(320, VB.w)} top={pct(250, VB.h)} Icon={Compass} win={won("explorer")} label="Explorer" score={runOf(demo, round, "explorer").score} />
        <NodeBadge left={pct(530, VB.w)} top={pct(250, VB.h)} Icon={Trophy} win={won("verifier")} label="Verifier" score={runOf(demo, round, "verifier").score} />
      </div>
    </Panel>
  );
}

function BracketPath({ d, color, flow }: { d: string; color: string; flow?: boolean }) {
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={flow ? 3 : 2.5} strokeLinecap="round" opacity={flow ? 1 : 0.7} />
      {flow && <path d={d} fill="none" stroke="#d6ffce" strokeWidth={1.5} strokeLinecap="round" className="path-flow" />}
    </>
  );
}

function Diamond({ x, y, on }: { x: number; y: number; on: boolean }) {
  const c = on ? "#7cff57" : "#5b4d82";
  return (
    <g transform={`translate(${x} ${y}) rotate(45)`}>
      <rect x={-6} y={-6} width={12} height={12} fill="#0e0e15" stroke={c} strokeWidth={2} rx={2} />
    </g>
  );
}

function NodeBadge({
  left,
  top,
  Icon,
  win,
  label,
  score,
  pulse,
}: {
  left: string;
  top: string;
  Icon: LucideIcon;
  win: boolean;
  label: string;
  score?: number;
  pulse?: boolean;
}) {
  return (
    <div className="absolute flex flex-col items-center" style={{ left, top, transform: "translate(-50%, -50%)" }}>
      <div className={pulse ? "node-glow" : ""}>
        <Hexicon Icon={Icon} win={win} size={pulse ? 54 : 48} />
      </div>
      <div className={`mt-1.5 text-[11px] font-bold uppercase tracking-wide ${win ? "text-arena-neon" : "text-arena-purpleBright"}`}>
        {label}
      </div>
      {score !== undefined && (
        <div className={`text-sm font-black tabular-nums ${win ? "text-arena-neon" : "text-arena-purpleBright"}`}>{score}</div>
      )}
    </div>
  );
}

// ── Skill mutation (right top) ────────────────────────────────────────────────
function SkillMutationPanel({ demo }: { demo: DemoResponse }) {
  // The most complete patch (Explorer learns scroll + verify) tells the full story.
  const patch = demo.patches.slice().sort((a, b) => b.newSkillText.length - a.newSkillText.length)[0];
  const winner = (patch?.sourceWinner ?? demo.round1.winnerId) as string;
  const lines = (patch?.newSkillText ?? "")
    .split(/(?<=\.)\s+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <Panel className="border-arena-neon/30 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Dna className="text-arena-neon" size={22} />
          <div>
            <div className="text-sm font-black uppercase tracking-widest">Skill Mutation</div>
            <div className="mt-0.5 text-xs text-arena-muted">
              Winner: <span className="font-semibold text-arena-neon">{META[winner]?.name?.toUpperCase() ?? winner.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <FileCode2 className="text-arena-neon/80" size={26} />
      </div>

      <div className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-arena-muted">Generated Skill Patch</div>
      <div className="mt-2 whitespace-pre-wrap rounded-lg border border-arena-neon/20 bg-black/50 p-3 font-mono text-[12px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3 text-arena-neon">
            <span className="select-none text-arena-neonDim">{i + 1}</span>
            <span className="min-w-0 break-words">
              <span className="text-arena-neon/70">+ </span>
              {line}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Source / patched / confidence ─────────────────────────────────────────────
function MetaPanel({ demo }: { demo: DemoResponse }) {
  const winner = demo.round1.winnerId as string;
  const targets = Array.from(new Set(demo.patches.flatMap((p) => p.targetAgents)));
  const targetNames = targets.map((t) => META[t]?.name ?? t).join(", ");
  return (
    <Panel className="p-4">
      <MetaRow Icon={User} label="Source Agent" value={<span className="text-arena-purpleBright">{META[winner]?.name ?? winner}</span>} />
      <MetaRow Icon={Users} label="Patched Agents" value={<span className="text-arena-purpleBright">{targetNames}</span>} />
      <MetaRow Icon={ShieldCheck} label="Confidence" value={<span className="font-bold text-arena-neon">94%</span>} last />
    </Panel>
  );
}

function MetaRow({ Icon, label, value, last }: { Icon: LucideIcon; label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${last ? "" : "border-b border-arena-border"}`}>
      <span className="flex items-center gap-2.5 text-sm text-arena-muted">
        <Icon size={17} className="text-arena-muted" />
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

// ── Trace replay (bottom left) ────────────────────────────────────────────────
type DisplayStep = { Icon: LucideIcon; label: string; t: string; ok: boolean; bad?: boolean; win?: boolean };

function traceToDisplay(steps: TraceStep[]): DisplayStep[] {
  const out: DisplayStep[] = [];
  steps.forEach((s, i) => {
    if (s.target === "enable-submit") return; // redundant with the scroll/checkbox step
    const d = labelFor(s);
    if (!d) return;
    out.push({ ...d, t: `00:${String((i + 1) * 3).padStart(2, "0")}` });
  });
  return out;
}

function labelFor(s: TraceStep): { Icon: LucideIcon; label: string; ok: boolean; bad?: boolean; win?: boolean } | null {
  const t = s.target;
  if (s.action === "navigate") return { Icon: Globe, label: "Opened signup page", ok: true };
  if (t === "fill-form") return { Icon: PenLine, label: "Filled the form", ok: true };
  if (t === "hidden-checkbox")
    return s.ok
      ? { Icon: CheckSquare, label: "Scrolled, found checkbox", ok: true }
      : { Icon: EyeOff, label: "Did not scroll below fold", ok: false };
  if (t === "confirm-modal") return { Icon: CheckSquare, label: "Confirmed the modal", ok: s.ok };
  if (t === "verify-success")
    return s.ok
      ? { Icon: MonitorCheck, label: "Verified dashboard", ok: true }
      : { Icon: EyeOff, label: "Skipped verification", ok: false };
  if (t === "fake-cta") return { Icon: XCircle, label: "Chased the fake CTA", ok: false };
  if (t === "dashboard") return { Icon: CheckCircle2, label: "Reached dashboard", ok: true, win: true };
  if (t === "stuck") return { Icon: XCircle, label: "Run failed", ok: false, bad: true };
  return null;
}

function TraceReplayPanel({ demo }: { demo: DemoResponse }) {
  const before = traceToDisplay(runOf(demo, 1, "planner").steps);
  const after = traceToDisplay(runOf(demo, 2, "planner").steps);
  const [from, to] = demo.state.agents.find((a) => a.id === "planner")!.scoreHistory;
  const delta = (to ?? 0) - (from ?? 0);

  return (
    <Panel className="p-4">
      <PanelTitle Icon={History}>Trace Replay</PanelTitle>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-arena-muted">Planner · Round 1</div>
          <ol className="space-y-1.5">
            {before.map((s, i) => (
              <TraceStepRow key={i} n={i + 1} {...s} />
            ))}
          </ol>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <ChevronsRight className="text-arena-neon pulse-soft" size={30} />
        </div>

        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-arena-neon">Planner After Patch</div>
          <ol className="space-y-1.5">
            {after.map((s, i) => (
              <TraceStepRow key={i} n={i + 1} {...s} good />
            ))}
          </ol>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-arena-neon/40 bg-arena-neon/[0.05] px-5 py-3 text-center">
          <TrendingUp className="text-arena-neon" size={26} />
          <div className="text-[11px] font-bold uppercase tracking-widest text-arena-neon">Agent Evolved</div>
          <div className="text-2xl font-black tabular-nums">
            <span className="text-arena-purpleBright">{from}</span>
            <span className="mx-1 text-arena-muted">→</span>
            <span className="text-arena-neon text-glow-neon">{to}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-arena-muted">Score improvement</div>
          <div className="text-lg font-black text-arena-neon">+{delta}</div>
        </div>
      </div>
    </Panel>
  );
}

function TraceStepRow({
  n,
  Icon,
  label,
  t,
  ok = true,
  bad,
  win,
  good,
}: DisplayStep & { n: number; good?: boolean }) {
  const accent = bad ? "text-arena-fail" : win ? "text-arena-neon" : good ? "text-arena-neon/90" : ok ? "text-arena-text/80" : "text-arena-fail";
  const ring = good || win ? "border-arena-neon/50 text-arena-neon" : bad || !ok ? "border-arena-fail/50 text-arena-fail" : "border-arena-border text-arena-muted";
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold tabular-nums ${ring}`}>{n}</span>
      <Icon size={15} className={accent} />
      <span className={`flex-1 ${bad || win ? "font-semibold" : ""} ${accent}`}>{label}</span>
      <span className="font-mono text-[11px] text-arena-muted">{t}</span>
    </li>
  );
}

// ── Population improved (bottom right) ─────────────────────────────────────────
function PopulationPanel({ demo, round, onRematch }: { demo: DemoResponse; round: 1 | 2; onRematch: () => void }) {
  const rows = ORDER.map((id) => {
    const a = demo.state.agents.find((x) => x.id === id)!;
    const [r1, r2] = a.scoreHistory;
    return { id, name: META[id].name, Icon: META[id].Icon, r1: r1 ?? 0, r2: r2 ?? 0, delta: (r2 ?? 0) - (r1 ?? 0) };
  });

  return (
    <Panel className="flex flex-1 flex-col p-4">
      <PanelTitle Icon={TrendingUp}>Population Improved</PanelTitle>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-arena-muted">
            <th className="pb-2 text-left font-semibold">Agent</th>
            <th className="pb-2 text-right font-semibold">Round 1</th>
            <th className="pb-2 text-right font-semibold">After Patch</th>
            <th className="pb-2 text-right font-semibold">Improvement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-arena-border">
              <td className="py-2.5">
                <span className="flex items-center gap-2 font-medium">
                  <p.Icon size={16} className={p.delta > 0 ? "text-arena-purpleBright" : "text-arena-neon"} />
                  {p.name}
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums text-arena-purpleBright">{p.r1}</td>
              <td className="py-2.5 text-right tabular-nums font-semibold text-arena-neon">{p.r2}</td>
              <td className="py-2.5 text-right tabular-nums font-bold">
                {p.delta > 0 ? <span className="text-arena-neon">+{p.delta}</span> : <span className="text-arena-muted">0</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        onClick={onRematch}
        className="mt-4 flex items-center justify-center gap-2.5 rounded-xl bg-arena-purple py-3.5 text-base font-black uppercase tracking-wider text-white glow-purple"
      >
        <Swords size={20} />
        {round === 1 ? "Rematch" : "Reset to Round 1"}
        <ChevronsRight size={20} className="opacity-70" />
      </motion.button>
    </Panel>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-arena-border bg-arena-panel ${className}`}>{children}</section>;
}

function PanelTitle({ Icon, children }: { Icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={18} className="text-arena-purpleBright" />
      <span className="text-sm font-black uppercase tracking-widest">{children}</span>
    </div>
  );
}

// ── Animated count-up ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    const from = display;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  return <span className={className}>{display}</span>;
}
