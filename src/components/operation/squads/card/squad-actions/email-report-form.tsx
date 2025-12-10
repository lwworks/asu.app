import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCurrentTime } from "@/context/current-time";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { ArrowRightIcon } from "lucide-react";
import type { FormEvent } from "react";

export const EmailReportForm = ({ squadId }: { squadId: string }) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();

  const handleSendReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get("email") as string;
    store.commit(
      events.squadLogCreatedWithText({
        id: crypto.randomUUID(),
        squadId,
        text: `Bericht an ${email} gesendet`,
        timestamp: currentTime,
      })
    );
    (event.target as HTMLFormElement).reset();
  };

  return (
    <form className="w-full" onSubmit={handleSendReport}>
      <Field className="">
        <FieldLabel htmlFor="email" className="font-normal">
          Bericht per Email senden
        </FieldLabel>
        <ButtonGroup>
          <Input
            name="email"
            id="email"
            type="email"
            placeholder="info@feuerwehr-oerel.de"
            required
          />
          <Button variant="outline" type="submit">
            <span>Senden</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </ButtonGroup>
      </Field>
    </form>
  );
};
