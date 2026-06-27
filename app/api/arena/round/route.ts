import { NextResponse } from "next/server";
import { getState, nextRound } from "@/lib/arena/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const round = await nextRound();
  return NextResponse.json({ round, state: getState() });
}
