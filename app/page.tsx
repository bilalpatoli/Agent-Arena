"use client";

import { useState } from "react";
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
  ArrowDownToLine,
  Send,
  MonitorCheck,
  CheckCircle2,
  TrendingUp,
  Swords,
  ChevronsRight,
  type LucideIcon,
} from "lucide-react";
import { ArenaLogo } from "@/components/ArenaLogo";

// ─────────────────────────────────────────────────────────────────────────────
// Agent Arena — single-screen tournament dashboard (Role 1, demo experience).
// Mocked data in-component on purpose: this is a pitch-deck-quality demo screen,
// not a production app. Rematch toggles the Round 1 → Round 2 visual state so the
// "losers evolved" payoff is one click away.
// ─────────────────────────────────────────────────────────────────────────────

type Status = "fail" | "winner" | "success" | "improved";

type AgentDef = {
  id: string;
  name: string;
  Icon: LucideIcon;
  strategy: string;
  r1: { score: number; status: Status };
  r2: { score: number; status: Status };
};

const AGENTS: AgentDef[] = [
  {
    id: "planner",
    name: "Planner",
    Icon: Network,
    strategy: "Methodical, low exploration",
    r1: { score: 62, status: "fail" },
    r2: { score: 88, status: "success" },
  },
  {
    id: "explorer",
    name: "Explorer",
    Icon: Compass,
    strategy: "Fast, risky clicks",
    r1: { score: 41, status: "fail" },
    r2: { score: 69, status: "improved" },
  },
  {
    id: "verifier",
    name: "Verifier",
    Icon: Trophy,
    strategy: "Checks final success state",
    r1: { score: 96, status: "winner" },
    r2: { score: 96, status: "winner" },
  },
];

const PATCH_DIFF = [
  "Before submitting a form, scan the full",
  "page and scroll below the fold for",
  "hidden required fields. After",
  "submission, verify that the expected",
  "success state is reached.",
];

const TRACE_BEFORE = [
  { Icon: Globe, label: "Opened signup page", t: "00:02", ok: true },
  { Icon: PenLine, label: "Filled form", t: "00:08", ok: true },
  { Icon: EyeOff, label: "Did not scroll", t: "00:15", ok: false },
  { Icon: CheckSquare, label: "Missed hidden checkbox", t: "00:18", ok: false },
  { Icon: XCircle, label: "Failed", t: "00:20", ok: false, bad: true },
];

const TRACE_AFTER = [
  { Icon: ArrowDownToLine, label: "Scrolled below fold", t: "00:04" },
  { Icon: CheckSquare, label: "Found checkbox", t: "00:10" },
  { Icon: Send, label: "Submitted form", t: "00:13" },
  { Icon: MonitorCheck, label: "Verified dashboard", t: "00:18" },
  { Icon: CheckCircle2, label: "Success", t: "00:20", win: true },
];

const POPULATION = [
  { id: "planner", name: "Planner", Icon: Network, r1: 62, r2: 88, delta: 26 },
  { id: "explorer", name: "Explorer", Icon: Compass, r1: 41, r2: 69, delta: 28 },
  { id: "verifier", name: "Verifier", Icon: Trophy, r1: 96, r2: 96, delta: 0 },
];

export default function ArenaDashboard() {
  const [round, setRound] = useState<1 | 2>(1);

  return (
    <main className="min-h-screen px-5 py-4 xl:px-7">
      <Header round={round} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left zone */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AGENTS.map((a) => (
              <AgentCard key={a.id} agent={a} round={round} />
            ))}
          </div>
          <BracketPanel round={round} />
          <TraceReplayPanel />
        </div>

        {/* Right zone */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <SkillMutationPanel />
          <MetaPanel />
          <PopulationPanel round={round} onRematch={() => setRound((r) => (r === 1 ? 2 : 1))} />
        </div>
      </div>
    </main>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ round }: { round: 1 | 2 }) {
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
function AgentCard({ agent, round }: { agent: AgentDef; round: 1 | 2 }) {
  const { score, status } = round === 1 ? agent.r1 : agent.r2;
  const isWin = status === "winner" || status === "success";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative rounded-2xl border bg-arena-panel p-4 transition-shadow ${
        isWin ? "border-arena-neon/60 glow-neon" : "border-arena-purple/35"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Hexicon Icon={agent.Icon} win={isWin} />
          <div>
            <div className="text-lg font-bold leading-tight">{agent.name}</div>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="text-right">
          <AnimatedNumber
            value={score}
            className={`text-3xl font-black tabular-nums leading-none ${
              isWin ? "text-arena-neon text-glow-neon" : "text-arena-text"
            }`}
          />
          <div className="text-[10px] font-semibold uppercase tracking-widest text-arena-muted">Score</div>
        </div>
      </div>
      <div className="mt-3 border-t border-arena-border pt-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-arena-muted">Strategy</div>
        <p className="mt-0.5 text-sm text-arena-text/85">{agent.strategy}</p>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string; icon: string }> = {
    fail: { label: "Failed", cls: "border-arena-fail/50 text-arena-fail", icon: "✕" },
    improved: { label: "Improved", cls: "border-arena-purpleBright/60 text-arena-purpleBright", icon: "▲" },
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
// Shared 640×330 coordinate space — the svg AND the overlay nodes both map into
// it, so nodes always sit exactly on the path ends at any width.
const VB = { w: 640, h: 330 };
const pct = (n: number, total: number) => `${(n / total) * 100}%`;

function BracketPanel({ round }: { round: 1 | 2 }) {
  // In round 2, Planner has evolved → its path lights up green. Explorer only
  // improved (didn't reach success), so its path stays purple.
  const plannerWon = round === 2;
  const P = "#5b4d82"; // dim purple loser path
  const G = "#7cff57"; // neon winner path

  return (
    <Panel className="arena-grid relative overflow-hidden p-4">
      <span className="absolute left-4 top-4 z-10 rounded-md border border-arena-border bg-arena-panel2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-arena-muted">
        Round {round}
      </span>

      {/* Winning-trait callout */}
      <div className="absolute right-5 top-[24%] z-10 max-w-[180px] rounded-lg border border-arena-neon/40 bg-arena-neon/[0.06] px-3 py-2 text-xs leading-snug text-arena-neon">
        Scanned full page + verified success state
      </div>

      <div className="relative aspect-[640/330] w-full">
        <svg viewBox="0 0 640 330" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
          {/* Planner (left) — green once evolved */}
          <BracketPath d="M110 226 C110 176 232 190 318 102" color={plannerWon ? G : P} flow={plannerWon} />
          {/* Explorer (center) — stays purple (improved, not success) */}
          <BracketPath d="M320 226 L320 100" color={P} />
          {/* Verifier (right) — winner, always green */}
          <BracketPath d="M530 226 C530 176 408 190 322 102" color={G} flow />

          <Diamond x={212} y={183} on={plannerWon} />
          <Diamond x={428} y={183} on />
        </svg>

        {/* Top winner node */}
        <NodeBadge left={pct(320, VB.w)} top={pct(78, VB.h)} Icon={Trophy} win label="Winner" pulse />

        {/* Bottom agent nodes */}
        <NodeBadge left={pct(110, VB.w)} top={pct(250, VB.h)} Icon={Network} win={plannerWon} label="Planner" score={plannerWon ? 88 : 62} />
        <NodeBadge left={pct(320, VB.w)} top={pct(250, VB.h)} Icon={Compass} win={false} label="Explorer" score={round === 2 ? 69 : 41} />
        <NodeBadge left={pct(530, VB.w)} top={pct(250, VB.h)} Icon={Trophy} win label="Verifier" score={96} />
      </div>
    </Panel>
  );
}

function BracketPath({ d, color, flow }: { d: string; color: string; flow?: boolean }) {
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={flow ? 3 : 2.5} strokeLinecap="round" opacity={flow ? 1 : 0.7} />
      {flow && (
        <path d={d} fill="none" stroke="#d6ffce" strokeWidth={1.5} strokeLinecap="round" className="path-flow" />
      )}
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

// Hex node overlaid on the SVG bracket, positioned in the shared coordinate space.
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
    <div
      className="absolute flex flex-col items-center"
      style={{ left, top, transform: "translate(-50%, -50%)" }}
    >
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
function SkillMutationPanel() {
  return (
    <Panel className="border-arena-neon/30 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Dna className="text-arena-neon" size={22} />
          <div>
            <div className="text-sm font-black uppercase tracking-widest">Skill Mutation</div>
            <div className="mt-0.5 text-xs text-arena-muted">
              Winner: <span className="font-semibold text-arena-neon">VERIFIER</span>
            </div>
          </div>
        </div>
        <FileCode2 className="text-arena-neon/80" size={26} />
      </div>

      <div className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-arena-muted">
        Generated Skill Patch
      </div>
      <pre className="mt-2 overflow-hidden rounded-lg border border-arena-neon/20 bg-black/50 p-3 font-mono text-[12px] leading-relaxed">
        {PATCH_DIFF.map((line, i) => (
          <div key={i} className="flex gap-3 text-arena-neon">
            <span className="select-none text-arena-neonDim">{i + 1}</span>
            <span>
              <span className="text-arena-neon/70">+ </span>
              {line}
            </span>
          </div>
        ))}
      </pre>
    </Panel>
  );
}

// ── Source / patched / confidence ─────────────────────────────────────────────
function MetaPanel() {
  return (
    <Panel className="p-4">
      <MetaRow Icon={User} label="Source Agent" value={<span className="text-arena-purpleBright">Verifier</span>} />
      <MetaRow
        Icon={Users}
        label="Patched Agents"
        value={<span className="text-arena-purpleBright">Planner, Explorer</span>}
      />
      <MetaRow
        Icon={ShieldCheck}
        label="Confidence"
        value={<span className="font-bold text-arena-neon">94%</span>}
        last
      />
    </Panel>
  );
}

function MetaRow({
  Icon,
  label,
  value,
  last,
}: {
  Icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
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
function TraceReplayPanel() {
  return (
    <Panel className="p-4">
      <PanelTitle Icon={History}>Trace Replay</PanelTitle>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
        {/* Before */}
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-arena-muted">
            Planner · Round 1
          </div>
          <ol className="space-y-1.5">
            {TRACE_BEFORE.map((s, i) => (
              <TraceStep key={i} n={i + 1} {...s} />
            ))}
          </ol>
        </div>

        {/* chevrons */}
        <div className="hidden items-center justify-center md:flex">
          <ChevronsRight className="text-arena-neon pulse-soft" size={30} />
        </div>

        {/* After */}
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-arena-neon">
            Planner After Patch
          </div>
          <ol className="space-y-1.5">
            {TRACE_AFTER.map((s, i) => (
              <TraceStep key={i} n={i + 1} good {...s} />
            ))}
          </ol>
        </div>

        {/* Evolved callout */}
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-arena-neon/40 bg-arena-neon/[0.05] px-5 py-3 text-center">
          <TrendingUp className="text-arena-neon" size={26} />
          <div className="text-[11px] font-bold uppercase tracking-widest text-arena-neon">Agent Evolved</div>
          <div className="text-2xl font-black tabular-nums">
            <span className="text-arena-purpleBright">62</span>
            <span className="mx-1 text-arena-muted">→</span>
            <span className="text-arena-neon text-glow-neon">88</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-arena-muted">Score improvement</div>
          <div className="text-lg font-black text-arena-neon">+26</div>
        </div>
      </div>
    </Panel>
  );
}

function TraceStep({
  n,
  Icon,
  label,
  t,
  ok = true,
  bad,
  win,
  good,
}: {
  n: number;
  Icon: LucideIcon;
  label: string;
  t: string;
  ok?: boolean;
  bad?: boolean;
  win?: boolean;
  good?: boolean;
}) {
  const accent = bad ? "text-arena-fail" : win ? "text-arena-neon" : good ? "text-arena-neon/90" : ok ? "text-arena-text/80" : "text-arena-fail";
  const ring = good || win ? "border-arena-neon/50 text-arena-neon" : bad ? "border-arena-fail/50 text-arena-fail" : "border-arena-border text-arena-muted";
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold tabular-nums ${ring}`}>
        {n}
      </span>
      <Icon size={15} className={accent} />
      <span className={`flex-1 ${bad || win ? "font-semibold" : ""} ${accent}`}>{label}</span>
      <span className="font-mono text-[11px] text-arena-muted">{t}</span>
    </li>
  );
}

// ── Population improved (bottom right) ─────────────────────────────────────────
function PopulationPanel({ round, onRematch }: { round: 1 | 2; onRematch: () => void }) {
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
          {POPULATION.map((p) => (
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
