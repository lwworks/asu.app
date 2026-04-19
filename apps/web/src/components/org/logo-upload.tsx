import { Button } from "@/components/ui/button";
import { useOrg } from "@/context/org";
import { orgLogoKey, uploadFile } from "@/lib/s3";
import { Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { OrgLogo, invalidateLogoCache } from "./logo";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

export const OrgLogoUpload = ({
  orgId,
  name,
  logoUrl,
}: {
  orgId: string;
  name: string;
  logoUrl: string | null;
}) => {
  const { refreshOrgs } = useOrg();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistLogoUrl = async (value: string | null) => {
    const res = await fetch(`${AUTH_URL}/api/orgs/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ logoUrl: value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Fehler beim Speichern");
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const key = orgLogoKey(orgId, file.name);
      const publicUrl = await uploadFile(file, key);
      await persistLogoUrl(publicUrl);
      if (logoUrl) invalidateLogoCache(logoUrl);
      await refreshOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!logoUrl) return;
    setError(null);
    setUploading(true);
    try {
      await persistLogoUrl(null);
      invalidateLogoCache(logoUrl);
      await refreshOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <OrgLogo name={name} logoUrl={logoUrl} size="md" />
      <div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadIcon className="size-4" />
            {logoUrl ? "Wappen ändern" : "Wappen hochladen"}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <Trash2Icon className="size-4" />
              Entfernen
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
};
