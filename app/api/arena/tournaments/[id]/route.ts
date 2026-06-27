import { NextResponse } from "next/server";
import { getRun } from "@/lib/arena/historyStore";

export const dynamic = "force-dynamic";

// GET /api/arena/tournaments/:id → the full persisted run (state powers the
// detail page). 404 when the id isn't found.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const run = await getRun(params.id);
  if (!run) return NextResponse.json({ error: "Tournament run not found" }, { status: 404 });
  return NextResponse.json({ run });
}
