import { NewOperation } from "../components/operation/new";

export const Route = createFileRoute({
  component: Index,
});

function Index() {
  return <NewOperation />;
}
