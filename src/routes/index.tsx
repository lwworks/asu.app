import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { NewOperation } from "@/components/operation/new";
import { OperationsOverview } from "@/components/operation/overview";

export const Route = createFileRoute({
  component: Index,
});

function Index() {
  return (
    <>
      <Header
        tabs={[
          { label: "Einsätze", href: "/" },
          { label: "Einstellungen", href: "/einstellungen" },
        ]}
      />
      <Main>
        <div className="h-full flex gap-8 p-8 items-stretch">
          <NewOperation className="h-full" />
          <OperationsOverview className="h-full w-full flex-1" />
        </div>
      </Main>
    </>
  );
}
