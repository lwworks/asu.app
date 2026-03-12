import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { forceById$ } from "@/livestore/queries/force/force-by-id";
import { organizations$ } from "@/livestore/queries/organization/organizations";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { PlusIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Combobox } from "../ui/combobox";
import { DatePicker } from "../ui/date-picker";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export const ForceForm = ({
  forceId,
  setForceId,
  open,
  setOpen,
}: {
  forceId?: string;
  setForceId: (forceId: string | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { store } = useStore();
  const organizations = store.useQuery(organizations$());
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [annualTraining, setAnnualTraining] = useState<Date | undefined>(
    undefined
  );
  const [medicalCheck, setMedicalCheck] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (forceId) {
      const force = store.query(forceById$(forceId));
      if (force) {
        setName(force.name);
        setOrganization(force.organization ?? "");
        setAnnualTraining(force.annualTraining ?? undefined);
        setMedicalCheck(force.medicalCheck ?? undefined);
      }
    } else {
      setName("");
      setOrganization("");
      setAnnualTraining(undefined);
      setMedicalCheck(undefined);
    }
  }, [forceId, store]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (forceId) {
      store.commit(
        events.forceUpdated({
          id: forceId,
          name: name.trim(),
          organization: organization.trim(),
          annualTraining,
          medicalCheck,
          updatedAt: new Date(),
        })
      );
    } else {
      store.commit(
        events.forceCreated({
          id: crypto.randomUUID(),
          name: name.trim(),
          organization: organization.trim(),
          annualTraining,
          medicalCheck,
          updatedAt: new Date(),
        })
      );
    }

    setOpen(false);
    setTimeout(() => {
      setForceId(undefined);
    }, 400);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setTimeout(() => {
            setForceId(undefined);
            setName("");
            setOrganization("");
            setAnnualTraining(undefined);
            setMedicalCheck(undefined);
          }, 400);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          <span>Personal hinzufügen</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 gap-0 sm:max-w-xl">
        <DialogHeader className="border-b bg-white/4 p-6">
          <DialogTitle>
            Personal {forceId ? "bearbeiten" : "hinzufügen"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <FieldGroup className="grid grid-cols-2 gap-x-2">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder="Name"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="organization">Organisation</FieldLabel>
                <Combobox
                  options={[...new Set(organizations)].map((org) => ({
                    id: org as string,
                    label: org as string,
                  }))}
                  value={organization}
                  setValue={setOrganization}
                  placeholder="Organisation"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="annualTraining">
                  Belastungsübung
                </FieldLabel>
                <DatePicker
                  date={annualTraining}
                  setDate={setAnnualTraining}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="medicalCheck">G26.3</FieldLabel>
                <DatePicker date={medicalCheck} setDate={setMedicalCheck} />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter className="border-t bg-white/4 p-6">
            <Button type="submit">
              {forceId ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
