import { GoogleGenAI } from "@google/genai";
import { chromium, type Browser, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Agent, TraceStep } from "./types";
import type { Challenge } from "./challenge";

// ─────────────────────────────────────────────────────────────────────────────
// Live computer-use loop: Gemini 3.5 Flash drives a real headless Chromium over
// the /challenge page. The agent's strategy + SKILL.md become the system
// instruction, so a patched agent literally behaves differently in the browser.
//
//   screenshot → ai.interactions.create(computer_use) → function_call(s)
//   → execute in Playwright → screenshot → function_result → repeat
//
// Coordinates come back normalized 0–999 and are denormalized to the viewport.
// Any failure throws; the HybridRunner catches it and falls back to the mock.
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = "gemini-3.5-flash";
const VIEWPORT = { width: 1280, height: 800 };
const DEFAULT_MAX_STEPS = 14;

function dbg(msg: string) {
  if (process.env.ARENA_DEBUG) console.log(`[cu] ${msg}`);
}

export interface ComputerUseResult {
  steps: TraceStep[];
  success: boolean;
  clickedDecoy: boolean;
  finalUrl: string;
  finalState: string;
}

export async function runComputerUse(
  agent: Agent,
  challenge: Challenge,
  opts: { baseUrl: string; maxSteps?: number; recordDir?: string } = {
    baseUrl: "http://localhost:3001",
  },
): Promise<ComputerUseResult> {
  const maxSteps = opts.maxSteps ?? DEFAULT_MAX_STEPS;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  let browser: Browser | null = null;
  const steps: TraceStep[] = [];
  let clickedDecoy = false;
  let stepIndex = 0;
  if (opts.recordDir) mkdirSync(opts.recordDir, { recursive: true });

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: VIEWPORT,
      ...(opts.recordDir ? { recordVideo: { dir: opts.recordDir, size: VIEWPORT } } : {}),
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000); // no Playwright action may hang the loop
    const startUrl = new URL(challenge.url, opts.baseUrl).toString();
    // NOT "networkidle": the Next dev HMR websocket keeps the network busy forever.
    await page.goto(startUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    let prevId: string | undefined;
    let pendingResult: any[] | null = null; // function_result steps to send next turn

    for (let turn = 0; turn < maxSteps; turn++) {
      const shot = await screenshot(page);

      const input = prevId
        ? pendingResult!
        : [
            { type: "text", text: buildPrompt(agent, challenge) },
            { type: "image", data: shot, mime_type: "image/jpeg" },
          ];

      dbg(`turn ${turn}: calling Gemini (prevId=${prevId ? "y" : "n"})`);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      let interaction: any;
      try {
        interaction = await ai.interactions.create(
          {
            model: MODEL,
            store: true,
            system_instruction: buildSystemInstruction(agent),
            tools: [{ type: "computer_use", environment: "browser" }] as any,
            previous_interaction_id: prevId,
            input: input as any,
          },
          { abortSignal: ctrl.signal } as any,
        );
      } finally {
        clearTimeout(timer);
      }
      prevId = interaction.id;

      const calls = (interaction.steps ?? []).filter((s: any) => s.type === "function_call");
      dbg(`turn ${turn}: ${calls.length} action(s)`);
      const reasoning = (interaction.steps ?? [])
        .filter((s: any) => s.type === "model_output")
        .flatMap((s: any) => (s.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text))
        .join(" ");

      if (calls.length === 0) {
        // Model produced no action → it considers the task finished.
        if (reasoning)
          steps.push(mk(stepIndex++, "done", reasoning.slice(0, 200), undefined, shot, true));
        break;
      }

      pendingResult = [];
      for (const call of calls) {
        const action = String(call.name);
        const args = call.arguments ?? {};
        const intent = String(args.intent ?? args.text ?? action);

        if (isDecoy(action, args, challenge)) clickedDecoy = true;

        const ok = await executeAction(page, action, args).catch(() => false);
        const afterShot = await screenshot(page);
        if (opts.recordDir) {
          writeFileSync(
            join(opts.recordDir, `frame-${String(stepIndex).padStart(2, "0")}-${normalizeAction(action)}.jpg`),
            Buffer.from(afterShot, "base64"),
          );
        }
        steps.push(
          mk(stepIndex++, normalizeAction(action), intent, targetFromArgs(args), afterShot, ok),
        );

        pendingResult.push({
          type: "function_result",
          name: action,
          call_id: call.id,
          result: [
            { type: "text", text: JSON.stringify({ url: page.url() }) },
            { type: "image", data: afterShot, mime_type: "image/jpeg" },
          ],
        });

        if (await reachedSuccess(page, challenge)) break;
      }

      if (await reachedSuccess(page, challenge)) break;
    }

    const success = await reachedSuccess(page, challenge);
    return {
      steps,
      success,
      clickedDecoy,
      finalUrl: page.url(),
      finalState: success ? "success" : "incomplete",
    };
  } finally {
    if (opts.recordDir) {
      // Persist the trace (intents only, screenshots are the frame-*.jpg files)
      // even if the run threw partway (e.g. a 429), so proof artifacts survive.
      writeFileSync(
        join(opts.recordDir, "trace.json"),
        JSON.stringify(
          { agent: agent.id, clickedDecoy, steps: steps.map(({ screenshot, ...s }) => s) },
          null,
          2,
        ),
      );
    }
    await browser?.close(); // flushes the recorded video
  }
}

// ── browser action executor ──────────────────────────────────────────────────
async function executeAction(page: Page, action: string, args: any): Promise<boolean> {
  const [x, y] = denorm(args);
  switch (action) {
    case "open_web_browser":
      return true;
    case "click_at":
    case "click":
      await page.mouse.click(x, y);
      break;
    case "hover_at":
    case "hover":
      await page.mouse.move(x, y);
      break;
    case "type_text_at":
    case "type": {
      if (Number.isFinite(x) && Number.isFinite(y)) await page.mouse.click(x, y);
      if (args.clear_before_typing) await page.keyboard.press("Meta+A").catch(() => {});
      await page.keyboard.type(String(args.text ?? ""));
      if (args.press_enter) await page.keyboard.press("Enter");
      break;
    }
    case "scroll_document": {
      const dir = String(args.direction ?? "down");
      await page.mouse.wheel(0, dir === "up" ? -700 : 700);
      break;
    }
    case "scroll_at": {
      const mag = Number(args.magnitude ?? 700);
      const dir = String(args.direction ?? "down");
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, dir === "up" ? -mag : mag);
      break;
    }
    case "key_combination":
    case "keypress": {
      const keys = String(args.keys ?? args.key ?? "").replace(/\+/g, "+");
      if (keys) await page.keyboard.press(keys).catch(() => {});
      break;
    }
    case "navigate":
      if (args.url) await page.goto(String(args.url), { waitUntil: "networkidle" });
      break;
    case "go_back":
      await page.goBack().catch(() => {});
      break;
    case "wait":
    case "wait_5_seconds":
      await page.waitForTimeout(Math.min(Number(args.seconds ?? 2) * 1000, 5000));
      break;
    default:
      // Unknown action: best-effort click if coords present, else no-op.
      if (Number.isFinite(x) && Number.isFinite(y)) await page.mouse.click(x, y);
  }
  await page.waitForTimeout(350);
  return true;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function denorm(args: any): [number, number] {
  const nx = Number(args.x);
  const ny = Number(args.y);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return [NaN, NaN];
  return [Math.round((nx / 1000) * VIEWPORT.width), Math.round((ny / 1000) * VIEWPORT.height)];
}

async function screenshot(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: "jpeg", quality: 55 });
  return buf.toString("base64");
}

async function reachedSuccess(page: Page, challenge: Challenge): Promise<boolean> {
  // Real challenges: confirm via visible success text on the page.
  if (challenge.successText?.length) {
    const body = await page.textContent("body").catch(() => "");
    return challenge.successText.some((t) => body?.includes(t));
  }
  // Synthetic challenge: the dashboard heading testid.
  return page
    .getByTestId("dashboard-heading")
    .isVisible({ timeout: 200 })
    .catch(() => false);
}

function isDecoy(action: string, args: any, challenge: Challenge): boolean {
  const intent = String(args.intent ?? "").toLowerCase();
  return intent.includes("get started") || intent.includes(challenge.decoy.label.toLowerCase().slice(0, 8));
}

function targetFromArgs(args: any): string | undefined {
  return args.intent ? String(args.intent).slice(0, 40) : undefined;
}

function normalizeAction(action: string): string {
  if (action.startsWith("click")) return "click";
  if (action.startsWith("type")) return "type";
  if (action.startsWith("scroll")) return "scroll";
  if (action.includes("navigate")) return "navigate";
  return action;
}

function mk(
  index: number,
  action: string,
  description: string,
  target: string | undefined,
  shot: string,
  ok: boolean,
): TraceStep {
  return { index, action, description, target, screenshot: `data:image/jpeg;base64,${shot}`, ok };
}

function buildSystemInstruction(agent: Agent): string {
  return [
    `You are "${agent.name}", an autonomous web agent. ${agent.tagline}`,
    `Operating strategy: ${agent.strategy}`,
    `Your current skills (these define and LIMIT how you behave):`,
    ...agent.skills.map((s) => `- ${s.text}`),
    `Act strictly in line with these skills. If a skill is absent, do NOT improvise that behavior.`,
  ].join("\n");
}

function buildPrompt(agent: Agent, challenge: Challenge): string {
  const lines = [`Task: ${challenge.goal}`];
  if (challenge.credentials) {
    lines.push(
      `Credentials — username: ${challenge.credentials.username}  password: ${challenge.credentials.password}`,
    );
  }
  if (challenge.taskSpec) lines.push(`Steps:\n${challenge.taskSpec}`);
  lines.push(
    `You are on the page now. Complete the task using the computer-use tools.`,
    `Stop only when the task is genuinely complete or you have exhausted your approach.`,
  );
  return lines.join("\n");
}
