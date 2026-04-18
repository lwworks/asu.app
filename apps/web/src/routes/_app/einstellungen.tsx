import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { OrgDeleteDialog } from "@/components/org/delete-dialog";
import { OrgLogo } from "@/components/org/logo";
import { OrgLogoUpload } from "@/components/org/logo-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
        {currentOrg && (
          <div className="p-8 max-w-2xl space-y-6">
            <Card className="py-0 w-full">
              <CardHeader className="border-b pt-6 bg-white/4">
                <CardTitle className="text-2xl">Organisation</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Verwalte die Angaben deiner Organisation."
                    : "Angaben deiner Organisation. Änderungen sind nur für Admins möglich."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Logo</FieldLabel>
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
                  </Field>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <div className="text-sm text-muted-foreground">
                      {currentOrg.name}
                    </div>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
            {isAdmin && (
              <Card className="py-0 w-full border-destructive/50">
                <CardHeader className="border-b pt-6 bg-destructive/5">
                  <CardTitle className="text-2xl">Gefahrenzone</CardTitle>
                  <CardDescription>
                    Das Löschen einer Organisation ist endgültig. Alle
                    Mitgliedschaften und Einladungen werden entfernt.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-end border-t bg-destructive/5 pb-6">
                  <OrgDeleteDialog
                    orgId={currentOrg.orgId}
                    orgName={currentOrg.name}
                  />
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </Main>
    </>
  );
}
