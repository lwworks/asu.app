import { OperationHeader } from "@/components/operation/header";
import { OperationSquads } from "@/components/operation/squads/overview";
import { operation$ } from "@/livestore/queries/operation";
import { useStore } from "@livestore/react";

export const Route = createFileRoute({
  loader: async ({ params: { operationId } }) => operationId,
  component: Operation,
});

function Operation() {
  const operationId = Route.useLoaderData();
  const { store } = useStore();
  const operation = store.query(operation$(operationId));

  return (
    <>
      <OperationHeader operation={operation} />
      <OperationSquads operationId={operationId} />
    </>
  );
}
