"use client";

import { Trophy, type LucideIcon } from "lucide-react";
import type { TournamentState } from "@/lib/arena/types";
import { roundByNumber, runForAgent } from "@/lib/arena/view";
import { agentIcon } from "./ui";

// Tournament bracket rendered in a shared 640×330 coordinate space so the nodes
// always sit on the path ends. Colors are derived from real per-round results.
const VB = { w: 640, h: 330 };
const pct = (n: number, total: number) => `${(n / total) * 100}%`;
const NEON = "#7cff57";
const DIM = "#5b4d82";

const SLOTS = [
  { id: "planner", x: 110 },
  { id: "explorer", x: 320 },
  { id: "verifier", x: 530 },
];

export function ArenaBracket({ state, round }: { state: TournamentState; round: number }) {
  const rd = roundByNumber(state, round);
  const won = (id: string) => runForAgent(rd, id)?.result === "success";
  const scoreOf = (id: string) => runForAgent(rd, id)?.score;

  const path = (x: number) =>
    x === 320 ? "M320 226 L320 100" : `M${x} 226 C${x} 176 ${x < 320 ? 232 : 408} 190 ${x < 320 ? 318 : 322} 102`;

  return (
    <div className="relative aspect-[640/330] w-full">
      <span className="absolute left-0 top-0 z-10 rounded-md border border-arena-border bg-arena-panel2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-arena-muted">
        Round {round}
      </span>

      <svg viewBox="0 0 640 330" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        {SLOTS.map((s) => (
          <BracketPath key={s.id} d={path(s.x)} color={won(s.id) ? NEON : DIM} flow={won(s.id)} />
        ))}
        <Diamond x={212} y={183} on={won("planner")} />
        <Diamond x={428} y={183} on={won("verifier")} />
      </svg>

      <NodeBadge left={pct(320, VB.w)} top={pct(78, VB.h)} Icon={Trophy} win label="Winner" pulse />
      {SLOTS.map((s) => (
        <NodeBadge
          key={s.id}
          left={pct(s.x, VB.w)}
          top={pct(250, VB.h)}
          Icon={agentIcon(s.id)}
          win={won(s.id)}
          label={state.agents.find((a) => a.id === s.id)?.name ?? s.id}
          score={scoreOf(s.id)}
        />
      ))}
    </div>
  );
}

function BracketPath({ d, color, flow }: { d: string; color: string; flow?: boolean }) {
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={flow ? 3 : 2.5} strokeLinecap="round" opacity={flow ? 1 : 0.7} />
      {flow && <path d={d} fill="none" stroke="#d6ffce" strokeWidth={1.4} strokeLinecap="round" className="path-flow" />}
    </>
  );
}

function Diamond({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(45)`}>
      <rect x={-6} y={-6} width={12} height={12} fill="#0e0e15" stroke={on ? NEON : DIM} strokeWidth={2} rx={2} />
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
  const color = win ? NEON : "#a78bfa";
  return (
    <div className="absolute flex flex-col items-center" style={{ left, top, transform: "translate(-50%, -50%)" }}>
      <span
        className={`grid place-items-center rounded-xl border ${pulse ? "node-glow" : ""}`}
        style={{
          width: pulse ? 50 : 44,
          height: pulse ? 50 : 44,
          borderColor: win ? "rgba(124,255,87,0.5)" : "rgba(139,92,246,0.4)",
          background: win ? "rgba(124,255,87,0.07)" : "rgba(139,92,246,0.06)",
        }}
      >
        <Icon size={pulse ? 22 : 19} style={{ color }} />
      </span>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
        {label}
      </div>
      {score !== undefined && (
        <div className="text-sm font-bold tabular-nums" style={{ color }}>
          {score}
        </div>
      )}
    </div>
  );
}
