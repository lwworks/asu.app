import { ImportForces } from "@/components/forces/import";
import { ForcesTable } from "@/components/forces/table";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";

export const ForcesPage = () => {
  return (
    <>
      <Header
        tabs={[
          { label: "Einsätze", href: "/" },
          { label: "Personal", href: "/personal" },
          { label: "Einstellungen", href: "/einstellungen" },
        ]}
      />
      <Main className="p-8 flex items-stretch gap-8">
        <ForcesTable />
        <div className="w-128 shrink-0">
          <ImportForces />
        </div>
      </Main>
    </>
  );
};
