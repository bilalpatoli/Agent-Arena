import { buildCustomChallenge } from "@/lib/arena/challenge";
import { runRelay, type RelayEvent } from "@/lib/arena/relay";

export const dynamic = "force-dynamic";
export const maxDuration = 800; // multiple live attempts (needs a persistent server)

// Streams a relay / continual-learning run as Server-Sent Events.
// Body: { url, task, maxAttempts?, credentials? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { url, task, maxAttempts, credentials } = body ?? {};
  if (!url || !task) {
    return new Response(JSON.stringify({ error: "url and task are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const challenge = buildCustomChallenge({ url, task, credentials });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: RelayEvent | { type: string; challenge?: unknown }) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      send({ type: "challenge", challenge });
      try {
        await runRelay(
          challenge,
          { maxAttempts: Math.min(Number(maxAttempts) || 4, 6), baseUrl: challenge.url },
          send,
        );
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
