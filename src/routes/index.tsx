import { SquadsOverview } from "../components/squads/overview";

export const Route = createFileRoute({
  component: Index,
});

function Index() {
  return <SquadsOverview />;
}
