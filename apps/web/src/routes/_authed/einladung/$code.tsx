import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useOrg } from "@/context/org";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute({
  component: EinladungPage,
  loader: async ({ params }) => params.code,
});

function EinladungPage() {
  const code = Route.useLoaderData();
  const { user } = useAuth();
  const { refreshOrgs, switchOrg } = useOrg();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const AUTH_URL = import.meta.env.VITE_AUTH_URL;

  const handleRedeem = async () => {
    setError("");
    setLoading(true);

    const res = await fetch(`${AUTH_URL}/api/invites/${code}/redeem`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Einladung konnte nicht eingelöst werden");
      setLoading(false);
      return;
    }

    const data = await res.json();
    await refreshOrgs();
    await switchOrg(data.orgId);
    setSuccess(true);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">ASÜ.APP</h1>
          <p className="text-muted-foreground">
            Bitte zuerst anmelden, um die Einladung einzulösen.
          </p>
          <a href="/anmelden" className="text-foreground underline">
            Zur Anmeldung
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">ASÜ.APP</h1>
        <p className="text-muted-foreground">
          Einladungscode: <strong>{code}</strong>
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success ? (
          <p className="text-sm text-foreground">
            Erfolgreich beigetreten! Du wirst weitergeleitet...
          </p>
        ) : (
          <Button
            className="w-full"
            onClick={handleRedeem}
            disabled={loading}
          >
            {loading ? "..." : "Einladung annehmen"}
          </Button>
        )}
      </div>
    </div>
  );
}
