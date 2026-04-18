import { useState } from "react";
import { useOrg } from "@/context/org";
import { BasicHeader } from "@/components/layout/basic-header";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import slugify from "slugify";

export const Route = createFileRoute({
  component: NeueOrganisationPage,
});

function NeueOrganisationPage() {
  const { switchOrg, refreshOrgs } = useOrg();
  const navigate = useNavigate();
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
    navigate({ to: "/" });
  };

  return (
    <>
      <BasicHeader />
      <Main>
        <div className="mx-auto w-full max-w-sm pt-16 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              Neue Organisation
            </h1>
            <p className="text-muted-foreground text-sm">
              Erstelle eine neue Organisation, um loszulegen.
            </p>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
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
        </div>
      </Main>
    </>
  );
}
