import { Header } from "@/components/header";
import { OperationsOverview } from "@/components/operation/overview";
import { NewOperation } from "../components/operation/new";

export const Route = createFileRoute({
  component: Index,
});

function Index() {
  return (
    <>
      <Header />
      <main className="h-[calc(100vh-4rem)]">
        <div className="h-full flex gap-8 p-8 items-stretch">
          <NewOperation className="h-full" />
          <OperationsOverview className="h-full w-full flex-1" />
        </div>
      </main>
    </>
  );
}
