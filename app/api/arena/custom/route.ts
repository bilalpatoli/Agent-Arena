import { buildCustomChallenge } from "@/lib/arena/challenge";
import { runCustomTournament, type CustomEvent } from "@/lib/arena/custom";

export const dynamic = "force-dynamic";
export const maxDuration = 800; // long-running live run (needs a persistent server, not serverless)

// Streams a live custom-URL tournament as Server-Sent Events.
// Body: { url, task, credentials?: { username, password } }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { url, task, credentials } = body ?? {};
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
      const send = (e: CustomEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      // tell the client what challenge we built
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "challenge", challenge })}\n\n`),
      );
      try {
        await runCustomTournament(challenge, send);
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
