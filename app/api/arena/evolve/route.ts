import { NextResponse } from "next/server";
import { evolveArena, getState } from "@/lib/arena/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const patches = evolveArena();
  return NextResponse.json({ patches, state: getState() });
}
