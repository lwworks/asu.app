import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/utils";
import { events } from "@/livestore/schema";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { useStore } from "@livestore/react";
import {
  AlertTriangleIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export const MemberForm = ({
  squadId,
  members,
  memberToEdit,
  setMemberToEdit,
  onCloseClick,
  className,
}: {
  squadId: string;
  members: SquadMember[];
  memberToEdit?: SquadMember | null;
  setMemberToEdit: (member: SquadMember | null) => void;
  onCloseClick: () => void;
  className?: string;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>("");
  const [organization, setOrganization] = useState("");
  const [organizationError, setOrganizationError] = useState<string>("");
  const [startPressure, setStartPressure] = useState(300);
  const [equipmentId, setEquipmentId] = useState("");
  const [isLeader, setIsLeader] = useState(false);
  const showCloseButton = members.length > 1;

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setOrganization(memberToEdit.organization ?? "");
      setStartPressure(memberToEdit.startPressure);
      setEquipmentId(memberToEdit.equipmentId ?? "");
      setIsLeader(memberToEdit.isLeader);
    }
  }, [memberToEdit]);

  useEffect(() => {
    const newMember = availableMembers.find((m) => m.name === name);
    setOrganization(newMember?.organization ?? "");
    if (name !== "") setNameError("");
    if (newMember?.organization) setOrganizationError("");
  }, [name]);

  useEffect(() => {
    if (organization !== "") setOrganizationError("");
  }, [organization]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name) {
      setNameError("Truppmitglied auswählen.");
      if (!organization) setOrganizationError("Organisation auswählen.");
      return;
    }
    if (!organization) {
      setOrganizationError("Organisation auswählen.");
      return;
    }
    if (memberToEdit) {
      let editedFields = [];
      if (name !== memberToEdit.name) editedFields.push(`Name: ${name}`);
      if (organization !== memberToEdit.organization)
        editedFields.push(`Organisation: ${organization}`);
      if (startPressure !== memberToEdit.startPressure)
        editedFields.push(`Startdruck: ${startPressure}`);
      if (equipmentId !== memberToEdit.equipmentId)
        editedFields.push(`Gerät: ${equipmentId}`);
      if (isLeader !== memberToEdit.isLeader)
        editedFields.push(`Truppführer/in: ${isLeader ? "Ja" : "Nein"}`);

      if (editedFields.length > 0) {
        store.commit(
          events.squadLogCreatedWithText({
            id: crypto.randomUUID(),
            squadId,
            text: `${memberToEdit.name} bearbeitet: ${editedFields.join(", ")}`,
            timestamp: currentTime,
          })
        );
        store.commit(
          events.squadMemberUpdated({
            id: memberToEdit.id,
            name,
            organization,
            startPressure,
            equipmentId,
            isLeader,
          })
        );
      }
      setMemberToEdit(null);
    } else {
      store.commit(
        events.squadMemberCreated({
          id: crypto.randomUUID(),
          squadId,
          name,
          organization,
          startPressure,
          equipmentId,
          isLeader,
        })
      );
      store.commit(
        events.squadLogCreatedWithTextAndPressure({
          id: crypto.randomUUID(),
          squadId,
          text: `${
            isLeader ? "Truppführer/in" : "Truppmitglied"
          } ${name} (${organization})${
            equipmentId ? ` mit Gerät ${equipmentId}` : ""
          } hinzugefügt.`,
          pressure: startPressure,
          timestamp: currentTime,
        })
      );
    }

    (event.target as HTMLFormElement).reset();
    setName("");
    setOrganization("");
    setStartPressure(300);
    setEquipmentId("");
    setIsLeader(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("p-6 pt-1 pb-5 bg-white/4 border-b flex-none", className)}
    >
      <FieldGroup className="gap-2">
        <div className="flex items-center justify-between">
          <FieldLegend variant="label" className="m-0 font-normal">
            Truppmitglied {memberToEdit ? "bearbeiten" : "hinzufügen"}
          </FieldLegend>
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-2.5 hover:bg-transparent!"
              onClick={onCloseClick}
            >
              <XIcon className="size-4" />
            </Button>
          ) : (
            <div className="h-9" />
          )}
        </div>
        <Field>
          <FieldLabel htmlFor="name" className="sr-only">
            Name
          </FieldLabel>
          <Combobox
            options={availableMembers
              .filter((m) => !members.map((m) => m.name).includes(m.name))
              .map((m) => ({
                id: m.id,
                label: m.name,
                sublabel: m.organization,
              }))}
            value={name}
            setValue={setName}
            placeholder="Truppmitglied auswählen..."
            error={nameError}
          />
          {nameError ? (
            <FieldError className="-mt-2 text-xs">{nameError}</FieldError>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="name" className="sr-only">
            Organisation
          </FieldLabel>
          <Combobox
            options={availableOrganizations.map((m) => ({
              id: m.id,
              label: m.name,
            }))}
            value={organization}
            setValue={setOrganization}
            placeholder="Organisation auswählen..."
            error={organizationError}
          />
          {organizationError ? (
            <FieldError className="-mt-2 text-xs">
              {organizationError}
            </FieldError>
          ) : null}
        </Field>
        <FieldGroup className="grid grid-cols-2 gap-2!">
          <Field className="gap-1">
            <FieldLabel
              htmlFor="startPressure"
              className="font-normal text-muted-foreground"
            >
              Startdruck
            </FieldLabel>
            <ButtonGroup className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setStartPressure(startPressure - 10)}
              >
                <MinusIcon />
              </Button>
              <Input
                name="startPressure"
                id="startPressure"
                type="number"
                placeholder="Startdruck"
                className={cn(
                  "text-center font-mono text-base",
                  startPressure < 270 && "text-destructive text-left"
                )}
                required
                value={startPressure}
                onChange={(e) => setStartPressure(Number(e.target.value))}
              />
              {startPressure < 270 && (
                <Tooltip>
                  <TooltipTrigger className="absolute inset-y-0 w-9 right-9 flex items-center justify-center">
                    <AlertTriangleIcon className="size-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Druck zu niedrig.</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setStartPressure(startPressure + 10)}
              >
                <PlusIcon />
              </Button>
            </ButtonGroup>
          </Field>
          <Field className="gap-1">
            <FieldLabel
              htmlFor="equipmentId"
              className="font-normal text-muted-foreground"
            >
              Gerätenummer
            </FieldLabel>
            <Input
              name="equipmentId"
              id="equipmentId"
              type="number"
              placeholder="0"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Field className="flex flex-row items-center gap-0">
            <Checkbox
              name="isLeader"
              id="isLeader"
              className="h-5 w-5! flex-none cursor-pointer"
              checked={isLeader}
              onCheckedChange={(checked: boolean) => setIsLeader(checked)}
            />
            <FieldLabel
              htmlFor="isLeader"
              className="font-normal text-muted-foreground pl-2 cursor-pointer"
            >
              Truppführer/in
            </FieldLabel>
          </Field>
          {memberToEdit ? (
            <Button type="submit" variant="secondary">
              <CheckIcon className="size-4" />
              <span>Speichern</span>
            </Button>
          ) : (
            <Button type="submit" variant="secondary">
              <PlusIcon className="size-4" />
              <span>Hinzufügen</span>
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  );
};

const availableMembers = [
  {
    id: "1",
    name: "Lukas Brunkhorst",
    organization: "Feuerwehr Oerel",
  },
  {
    id: "2",
    name: "Niklas Pape",
    organization: "Feuerwehr Oerel",
  },
  {
    id: "3",
    name: "Nicolai Breden",
    organization: "Feuerwehr Barchel",
  },
  {
    id: "4",
    name: "Fabian Lau",
    organization: "Feuerwehr Barchel",
  },
  {
    id: "5",
    name: "Marcel Tiedemann",
    organization: "Feuerwehr Oerel",
  },
  {
    id: "6",
    name: "Jannis Hünecke",
    organization: "Feuerwehr Barchel",
  },
  {
    id: "7",
    name: "Benedikt Mügge",
    organization: "Feuerwehr Barchel",
  },
  {
    id: "8",
    name: "Leon Böhm",
    organization: "Feuerwehr Barchel",
  },
  {
    id: "9",
    name: "Lasse Schulz",
    organization: "Feuerwehr Barchel",
  },
  {
    id: "10",
    name: "Janek Tiedemann",
    organization: "Feuerwehr Oerel",
  },
  {
    id: "11",
    name: "Lea Duhme",
    organization: "Feuerwehr Oerel",
  },
  {
    id: "12",
    name: "Sven Klintworth",
    organization: "Feuerwehr Oerel",
  },
  {
    id: "13",
    name: "Rene Bennöder",
    organization: "Feuerwehr Barchel",
  },
  {
    id: "14",
    name: "Timo Roggenkamp",
    organization: "Feuerwehr Oerel",
  },
  {
    id: "15",
    name: "Philipp Grimm",
    organization: "Feuerwehr Barchel",
  },
];

const availableOrganizations = [
  {
    id: "1",
    name: "Feuerwehr Oerel",
  },
  {
    id: "2",
    name: "Feuerwehr Barchel",
  },
  {
    id: "3",
    name: "Feuerwehr Ebersdorf",
  },
  {
    id: "4",
    name: "Feuerwehr Alfstedt",
  },
  {
    id: "5",
    name: "Feuerwehr Hipstedt",
  },
  {
    id: "6",
    name: "Feuerwehr Heinschenwalde",
  },
  {
    id: "7",
    name: "Feuerwehr Oese",
  },
  {
    id: "8",
    name: "Feuerwehr Glinde",
  },
  {
    id: "9",
    name: "Feuerwehr Basdahl",
  },
  {
    id: "10",
    name: "Feuerwehr Volkmarst",
  },
  {
    id: "11",
    name: "Feuerwehr Neu Ebersdorf",
  },
];
