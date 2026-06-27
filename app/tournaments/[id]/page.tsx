import { TournamentDetailById } from "@/components/arena/detail";

// Full persisted tournament detail, loaded by id via GET /api/arena/tournaments/:id.
export default function TournamentByIdPage({ params }: { params: { id: string } }) {
  return <TournamentDetailById id={decodeURIComponent(params.id)} />;
}
