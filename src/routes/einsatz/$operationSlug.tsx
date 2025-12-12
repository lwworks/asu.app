import { OperationHeader } from "@/components/operation/header";
import { OperationSquads } from "@/components/operation/squads/overview";
import { operation$ } from "@/livestore/queries/operation";
import { useStore } from "@livestore/react";

export const Route = createFileRoute({
  loader: async ({ params: { operationSlug } }) => operationSlug,
  component: Operation,
});

function Operation() {
  const operationSlug = Route.useLoaderData();
  const { store } = useStore();
  const operation = store.useQuery(operation$(operationSlug));

  return (
    <>
      <OperationHeader operation={operation} />
      <main className="h-[calc(100vh-6rem)]">
        <OperationSquads operationId={operation.id} />
      </main>
    </>
  );
}
