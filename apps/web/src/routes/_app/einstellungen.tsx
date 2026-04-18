import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { OrgLogo } from "@/components/org/logo";
import { OrgLogoUpload } from "@/components/org/logo-upload";
import { useOrg } from "@/context/org";

export const Route = createFileRoute({
  component: Settings,
});

function Settings() {
  const { currentOrg } = useOrg();
  const isAdmin = currentOrg?.role === "admin";

  return (
    <>
      <Header
        tabs={[
          { label: "Einsätze", href: "/" },
          { label: "Personal", href: "/personal" },
          { label: "Einstellungen", href: "/einstellungen" },
        ]}
      />
      <Main>
        <div className="p-8 max-w-2xl space-y-8">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Organisation</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Verwalte die Angaben deiner Organisation."
                : "Angaben deiner Organisation. Änderungen sind nur für Admins möglich."}
            </p>
          </div>
          {currentOrg && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-medium">Logo</div>
                {isAdmin ? (
                  <OrgLogoUpload
                    orgId={currentOrg.orgId}
                    name={currentOrg.name}
                    logoUrl={currentOrg.logoUrl}
                  />
                ) : (
                  <OrgLogo
                    name={currentOrg.name}
                    logoUrl={currentOrg.logoUrl}
                    size="lg"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Name</div>
                <div className="text-sm text-muted-foreground">
                  {currentOrg.name}
                </div>
              </div>
            </div>
          )}
        </div>
      </Main>
    </>
  );
}
