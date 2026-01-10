import { ImportForces } from "@/components/forces/import";
import { ForcesList } from "@/components/forces/list";
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
        <ForcesList />
        <div className="w-128 shrink-0">
          <ImportForces />
        </div>
      </Main>
    </>
  );
};
