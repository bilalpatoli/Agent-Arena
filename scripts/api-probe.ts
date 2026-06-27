// Isolate the Gemini Interactions API: one text-only computer-use call, 30s cap.
//   npx tsx scripts/api-probe.ts
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

async function main() {
  const key = process.env.GEMINI_API_KEY ?? "";
  console.log(`key len=${key.length} prefix=${key.slice(0, 4)}…`);
  const ai = new GoogleGenAI({ apiKey: key });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);

  try {
    const res: any = await ai.interactions.create(
      {
        model: "gemini-3.5-flash",
        input: "Say the single word OK.",
      } as any,
      { abortSignal: ctrl.signal } as any,
    );
    console.log("OK — interaction id:", res.id);
    console.log("status:", res.status);
    const txt = (res.steps ?? [])
      .filter((s: any) => s.type === "model_output")
      .flatMap((s: any) => (s.content ?? []).map((c: any) => c.text))
      .join(" ");
    console.log("model said:", txt);
  } catch (e: any) {
    console.log("ERROR name:", e?.name);
    console.log("ERROR message:", e?.message);
    console.log("ERROR status:", e?.status ?? e?.code);
  } finally {
    clearTimeout(timer);
  }
}
main();
