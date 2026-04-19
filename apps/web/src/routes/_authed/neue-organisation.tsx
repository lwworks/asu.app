import { useRef, useState } from "react";
import { useOrg } from "@/context/org";
import { BasicHeader } from "@/components/layout/basic-header";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrgLogo } from "@/components/org/logo";
import { orgLogoKey, uploadFile } from "@/lib/s3";
import { useNavigate } from "@tanstack/react-router";
import { UploadIcon, XIcon } from "lucide-react";
import slugify from "slugify";

export const Route = createFileRoute({
  component: NeueOrganisationPage,
});

function NeueOrganisationPage() {
  const { switchOrg, refreshOrgs } = useOrg();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const AUTH_URL = import.meta.env.VITE_AUTH_URL;

  const handlePickLogo = (file: File) => {
    setLogoFile(file);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

    if (logoFile) {
      try {
        const key = orgLogoKey(org.id, logoFile.name);
        const publicUrl = await uploadFile(logoFile, key);
        await fetch(`${AUTH_URL}/api/orgs/${org.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ logoUrl: publicUrl }),
        });
      } catch (err) {
        console.error("Logo upload failed:", err);
      }
    }

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
            <div className="space-y-2">
              <Label>Wappen (optional)</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <span className="size-16 rounded shrink-0 overflow-hidden bg-muted">
                    <img
                      src={logoPreview}
                      alt="Wappen Vorschau"
                      className="w-full h-full object-cover"
                    />
                  </span>
                ) : (
                  <OrgLogo name={name || "?"} logoUrl={null} size="lg" />
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="size-4" />
                    {logoFile ? "Ändern" : "Auswählen"}
                  </Button>
                  {logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearLogo}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePickLogo(file);
                  }}
                />
              </div>
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
