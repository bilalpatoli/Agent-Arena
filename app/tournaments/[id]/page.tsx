import { TournamentDetail } from "@/components/arena/detail";

// Tournament detail by id. The backend currently serves a single in-memory
// tournament (lib/arena/store.ts), so TournamentDetail renders the current run
// regardless of the id.
// TODO(api): once runs are persisted with stable ids, fetch the specific run by
// `params.id` (e.g. GET /api/arena/runs/[id]) and pass it into TournamentDetail.
export default function TournamentByIdPage() {
  return <TournamentDetail />;
}
