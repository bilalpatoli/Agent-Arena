import { NextResponse } from "next/server";
import { resetArena } from "@/lib/arena/store";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ state: resetArena() });
}
