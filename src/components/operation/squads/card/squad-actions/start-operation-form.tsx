import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/utils";
import { validateTimeInput } from "@/lib/validate-time-input";
import { lowestStartPressure$ } from "@/livestore/queries/operation/lowest-start-pressure";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { format } from "date-fns";
import { PlayIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

export const StartOperationForm = ({
  squadId,
  memberCount,
  className,
}: {
  squadId: string;
  memberCount: number;
  className?: string;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const [inputError, setInputError] = useState<string>("");

  const handleStartOperation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const inputValue = formData.get("start-time") as string;
    let startTime = currentTime;
    if (inputValue !== "") {
      const { error, time } = validateTimeInput(inputValue, currentTime);
      if (error) {
        setInputError(error);
        return;
      }
      startTime = time!;
    }
    const { startPressure } = store.query(lowestStartPressure$(squadId));
    store.commit(events.squadStarted({ id: squadId, startedAt: startTime }));
    store.commit(
      events.squadLogCreatedWithTextAndPressure({
        id: crypto.randomUUID(),
        squadId,
        text: "Einsatz gestartet",
        pressure: startPressure,
        timestamp: startTime,
      })
    );
  };

  return (
    <form className="w-full flex gap-2" onSubmit={handleStartOperation}>
      <Field className="w-21 shrink-0">
        <FieldLabel htmlFor="start-time" className="sr-only">
          Startzeit
        </FieldLabel>
        <Input
          name="start-time"
          id="start-time"
          type="text"
          placeholder={format(currentTime, "HH:mm:ss")}
          aria-invalid={!!inputError}
        />
        {inputError ? (
          <FieldError className="-mt-2 text-xs whitespace-nowrap">
            {inputError}
          </FieldError>
        ) : null}
      </Field>
      <div className="relative w-full flex-1">
        <Button
          className={cn("w-full", className)}
          type="submit"
          disabled={memberCount === 0}
        >
          <PlayIcon className="size-3.5" />
          <span>Einsatz starten</span>
        </Button>
        {memberCount === 0 && (
          <Tooltip>
            <TooltipTrigger className="absolute inset-0" />
            <TooltipContent>
              <p>Der Trupp braucht mindestens ein Mitglied.</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </form>
  );
};
