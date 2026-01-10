import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
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
      <Header
        breadcrumbs={[
          { label: "Einsätze", href: "/" },
          { label: operation.description, href: "/einsatz/$operationSlug" },
        ]}
        tabs={[
          { label: "Übersicht", href: "/einsatz/$operationSlug" },
          { label: "Trupps", href: "/einsatz/$operationSlug/trupps" },
          { label: "Export", href: "/einsatz/$operationSlug/export" },
        ]}
      />
      <Main>Übersicht</Main>
    </>
  );
}
