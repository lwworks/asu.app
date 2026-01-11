import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { organizations$ } from "@/livestore/queries/organization/organizations";
import { useStore } from "@livestore/react";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
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
  const [name, setName] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [annualTraining, setAnnualTraining] = useState<Date | undefined>(
    undefined
  );
  const [medicalCheck, setMedicalCheck] = useState<Date | undefined>(undefined);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setTimeout(() => {
            setForceId(undefined);
          }, 400);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          <span>AGT hinzufügen</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 gap-0 sm:max-w-xl">
        <DialogHeader className="border-b bg-white/4 p-6">
          <DialogTitle>AGT {forceId ? "bearbeiten" : "hinzufügen"}</DialogTitle>
        </DialogHeader>
        <form className="p-6">
          <FieldGroup className="grid grid-cols-2 gap-x-2">
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                placeholder="Name"
                required
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="organization">Organisation</FieldLabel>
              <Combobox
                options={[...new Set(organizations)].map((organization) => ({
                  id: organization as string,
                  label: organization as string,
                }))}
                value={organization}
                setValue={setOrganization}
                placeholder="Organisation"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="annualTraining">Belastungsübung</FieldLabel>
              <DatePicker date={annualTraining} setDate={setAnnualTraining} />
            </Field>
            <Field>
              <FieldLabel htmlFor="medicalCheck">G26.3</FieldLabel>
              <DatePicker date={medicalCheck} setDate={setMedicalCheck} />
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};
