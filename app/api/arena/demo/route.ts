import { NextResponse } from "next/server";
import { runFullDemo } from "@/lib/arena/store";

export const dynamic = "force-dynamic";

// One call runs the entire story: round 1 -> evolve -> round 2.
export async function POST() {
  const result = await runFullDemo();
  return NextResponse.json(result);
}
