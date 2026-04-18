import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrg } from "@/context/org";
import { useNavigate } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

export const OrgDeleteDialog = ({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) => {
  const { refreshOrgs, switchOrg, clearCurrentOrg } = useOrg();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmation.trim() === orgName;

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError(null);
    }
  };

  const handleDelete = async () => {
    if (!matches || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}/api/orgs/${orgId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Löschen");
      }

      const remaining = (await refreshOrgs()) ?? [];
      setOpen(false);
      setConfirmation("");

      if (remaining.length > 0) {
        await switchOrg(remaining[0].orgId);
        navigate({ to: "/" });
      } else {
        clearCurrentOrg();
        navigate({ to: "/neue-organisation" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2Icon className="size-4" />
          Organisation löschen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Organisation löschen</DialogTitle>
          <DialogDescription>
            Diese Aktion ist endgültig. Alle Mitgliedschaften und Einladungen
            werden entfernt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="org-delete-confirm">
            Tippe <span className="font-semibold">{orgName}</span> ein, um die
            Löschung zu bestätigen.
          </Label>
          <Input
            id="org-delete-confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            disabled={loading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>
              Abbrechen
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!matches || loading}
          >
            {loading ? "Lösche..." : "Endgültig löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
