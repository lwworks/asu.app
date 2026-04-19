import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { OrgDeleteDialog } from "@/components/org/delete-dialog";
import { OrgLogo } from "@/components/org/logo";
import { OrgLogoUpload } from "@/components/org/logo-upload";
import { OrgNameInput } from "@/components/org/name-input";
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

export const SettingsPage = () => {
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
                    <FieldLabel>Name</FieldLabel>
                    {isAdmin ? (
                      <OrgNameInput
                        orgId={currentOrg.orgId}
                        name={currentOrg.name}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {currentOrg.name}
                      </div>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Wappen</FieldLabel>
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
                </FieldGroup>
              </CardContent>
              {isAdmin && (
                <CardFooter className="justify-between border-t bg-destructive/5 py-4">
                  <p className="text-sm text-muted-foreground">
                    Das Löschen einer Organisation ist endgültig.
                  </p>
                  <OrgDeleteDialog
                    orgId={currentOrg.orgId}
                    orgName={currentOrg.name}
                  />
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </Main>
    </>
  );
};
