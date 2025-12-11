import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/utils";
import { lowestStartPressure$ } from "@/livestore/queries/operation/lowest-start-pressure";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { format, setHours, setMinutes, setSeconds, subDays } from "date-fns";
import { PlayIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

const validateTime = (
  time: string,
  currentTime: Date
): { error?: string; startTime?: Date } => {
  // Check input format
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(time)) {
    return {
      error: "Format: HH:mm oder HH:mm:ss",
    };
  }
  // Parse the time string
  const parts = time.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length === 3 ? parseInt(parts[2], 10) : 0;
  // Create a date with the input time for today
  let resultDate = new Date(currentTime);
  resultDate = setHours(resultDate, hours);
  resultDate = setMinutes(resultDate, minutes);
  resultDate = setSeconds(resultDate, seconds);

  // Check if time should be yesterday
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();
  const inputTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
  const currentTimeInSeconds =
    currentHours * 3600 + currentMinutes * 60 + currentSeconds;
  if (inputTimeInSeconds > currentTimeInSeconds) {
    resultDate = subDays(resultDate, 1);
  }

  return { startTime: resultDate };
};

export const StartOperationForm = ({
  squadId,
  className,
}: {
  squadId: string;
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
      const { error, startTime: inputTime } = validateTime(
        inputValue,
        currentTime
      );
      if (error) {
        setInputError(error);
        return;
      }
      startTime = inputTime!;
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
      <Button
        className={cn(
          "bg-emerald-300 hover:bg-emerald-300/90 w-full flex-1",
          className
        )}
        type="submit"
      >
        <PlayIcon className="size-3.5" />
        <span>Einsatz starten</span>
      </Button>
    </form>
  );
};
