import { NextResponse } from "next/server";
import { listRuns, toSummary } from "@/lib/arena/historyStore";

export const dynamic = "force-dynamic";

// GET /api/arena/history → persisted tournament runs (summaries), newest first.
// Returns an empty array when nothing has been saved — never fabricated rows.
export async function GET() {
  const runs = (await listRuns()).map(toSummary);
  return NextResponse.json({ runs });
}
