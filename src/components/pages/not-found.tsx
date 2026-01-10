import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { IconOutline } from "../visuals/icon-outline";

export const NotFoundPage = () => {
  return (
    <>
      <Header
        tabs={[
          { label: "Einsätze", href: "/" },
          { label: "Einstellungen", href: "/einstellungen" },
        ]}
      />
      <Main className="flex flex-col items-center justify-center gap-4 pb-32">
        <div className="flex items-center gap-4">
          <IconOutline className="h-12 text-muted-foreground/50" />
          <h1 className="text-6xl font-mono text-primary">404</h1>
        </div>
        <div className="text-muted-foreground text-sm">
          Die Seite wurde nicht gefunden.
        </div>
      </Main>
    </>
  );
};
