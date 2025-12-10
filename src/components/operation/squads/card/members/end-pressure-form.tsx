import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCurrentTime } from "@/context/current-time";
import { events } from "@/livestore/schema";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { useStore } from "@livestore/react";
import { CheckIcon } from "lucide-react";
import type { FormEvent } from "react";

export const EndPressureForm = ({
  squadId,
  member,
}: {
  squadId: string;
  member: SquadMember;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();

  const handleSubmitEndPressure = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const endPressure = formData.get("end-pressure") as string;
    store.commit(
      events.squadMemberEndPressureUpdated({
        id: member.id,
        endPressure: Number(endPressure),
      })
    );
    store.commit(
      events.squadLogCreatedWithTextAndPressure({
        id: crypto.randomUUID(),
        squadId,
        text: `Enddruck ${member.name}`,
        pressure: Number(endPressure),
        timestamp: currentTime,
      })
    );
  };

  return (
    <form className="w-full" onSubmit={handleSubmitEndPressure}>
      <Field className="flex-row">
        <FieldLabel
          htmlFor="end-pressure"
          className="block leading-tight font-normal"
        >
          <span className="text-xs text-muted-foreground">Enddruck</span>
          <br />
          <span>{member.name}</span>
        </FieldLabel>
        <ButtonGroup>
          <Input
            name="end-pressure"
            id="end-pressure"
            type="number"
            placeholder="Enddruck"
            required
          />
          <Button variant="outline" type="submit">
            <CheckIcon className="size-4" />
          </Button>
        </ButtonGroup>
      </Field>
    </form>
  );
};
