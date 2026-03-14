import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useOrg } from "@/context/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import slugify from "slugify";

export const Route = createFileRoute({
  component: OrganisationenPage,
});

function OrganisationenPage() {
  const { user, signOut } = useAuth();
  const { orgs, switchOrg, refreshOrgs } = useOrg();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const AUTH_URL = import.meta.env.VITE_AUTH_URL;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const slug = slugify(name, { lower: true, strict: true });
    const res = await fetch(`${AUTH_URL}/api/orgs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, slug }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Fehler beim Erstellen");
      setLoading(false);
      return;
    }

    const org = await res.json();
    await refreshOrgs();
    await switchOrg(org.id);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">ASÜ.APP</h1>
          <p className="text-muted-foreground mt-1">
            Willkommen, {user?.name}
          </p>
        </div>

        {orgs.length > 0 && (
          <div className="space-y-2">
            <Label>Deine Organisationen</Label>
            <div className="space-y-2">
              {orgs.map((org) => (
                <Button
                  key={org.orgId}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => switchOrg(org.orgId)}
                >
                  {org.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <Label>Neue Organisation erstellen</Label>
          <div className="space-y-2">
            <Input
              placeholder="Name der Organisation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : "Erstellen"}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => signOut()}
        >
          Abmelden
        </Button>
      </div>
    </div>
  );
}
