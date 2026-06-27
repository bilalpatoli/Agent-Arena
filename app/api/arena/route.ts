import { NextResponse } from "next/server";
import { getState } from "@/lib/arena/store";
import { liveEnabled } from "@/lib/arena/geminiRunner";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ state: getState(), live: liveEnabled() });
}
