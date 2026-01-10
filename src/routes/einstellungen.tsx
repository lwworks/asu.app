import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";

export const Route = createFileRoute({
  component: Settings,
});

function Settings() {
  return (
    <>
      <Header
        tabs={[
          { label: "Einsätze", href: "/" },
          { label: "Einstellungen", href: "/einstellungen" },
        ]}
      />
      <Main>Einstellungen</Main>
    </>
  );
}
