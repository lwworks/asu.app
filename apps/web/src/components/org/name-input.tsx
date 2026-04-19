import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrg } from "@/context/org";
import { useEffect, useState } from "react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

export const OrgNameInput = ({
  orgId,
  name,
}: {
  orgId: string;
  name: string;
}) => {
  const { refreshOrgs } = useOrg();
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(name);
  }, [name]);

  const trimmed = value.trim();
  const dirty = trimmed !== name;
  const canSave = dirty && trimmed.length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${AUTH_URL}/api/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Speichern");
      }
      await refreshOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              setValue(name);
            }
          }}
          disabled={saving}
        />
        <Button
          type="button"
          size="default"
          variant="secondary"
          onClick={save}
          disabled={!canSave}
        >
          {saving ? "Speichere..." : "Speichern"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
