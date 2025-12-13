import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCurrentTime } from "@/context/current-time";
import { squadLogs$ } from "@/livestore/queries/operation/squad-logs";
import { events } from "@/livestore/schema";
import type { SquadLog } from "@/livestore/schema/operation/squad-log";
import { useStore } from "@livestore/react";
import { format } from "date-fns";
import { ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";

export const SquadLogs = ({ squadId }: { squadId: string }) => {
  const { currentTime } = useCurrentTime();
  const { store } = useStore();
  const logs = store.useQuery(squadLogs$(squadId));
  const logsRef = useRef<HTMLUListElement>(null);

  const handleSubmitLog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const text = formData.get("text") as string;
    const pressure = formData.get("pressure") as string;

    if (!text && !pressure) {
      return;
    } else if (text && pressure) {
      store.commit(
        events.squadLogCreatedWithTextAndPressure({
          id: crypto.randomUUID(),
          squadId,
          text,
          pressure: Number(pressure),
          timestamp: currentTime,
        })
      );
    } else if (text && !pressure) {
      store.commit(
        events.squadLogCreatedWithText({
          id: crypto.randomUUID(),
          squadId,
          text,
          timestamp: currentTime,
        })
      );
    } else if (!text && pressure) {
      store.commit(
        events.squadLogCreatedWithPressure({
          id: crypto.randomUUID(),
          squadId,
          pressure: Number(pressure),
          timestamp: currentTime,
        })
      );
    }
    (event.target as HTMLFormElement).reset();
  };

  useEffect(() => {
    setTimeout(
      () =>
        logsRef.current?.scrollTo({
          top: logsRef.current?.scrollHeight ?? 9999,
          behavior: "smooth",
        }),
      100
    );
  }, [logs.length]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-6 pt-6 flex text-xs uppercase text-muted-foreground/50 font-medium tracking-wider border-b pb-3 flex-none">
        <div className="w-17 shrink-0">Zeit</div>
        <div className="grow">Meldung</div>
        <div className="w-12 shrink-0">Druck</div>
      </div>
      <div className="relative flex-1 min-h-0">
        <ul
          ref={logsRef}
          className="px-6 py-3 space-y-2 h-full overflow-y-auto"
        >
          {(logs as SquadLog[])
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .map((log) => (
              <li key={log.id} className="flex text-sm leading-tight">
                <div className="w-17 shrink-0 text-muted-foreground/50">
                  {format(log.timestamp, "HH:mm:ss")}
                </div>
                <div className="grow text-muted-foreground">{log.text}</div>
                <div className="w-12 shrink-0 text-muted-foreground/50 text-right">
                  {log.pressure}
                </div>
              </li>
            ))}
        </ul>
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-card to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-card to-transparent" />
      </div>
      <form
        className="flex gap-2 p-6 pt-0 relative z-10 flex-none"
        onSubmit={handleSubmitLog}
      >
        <Field className="grow">
          <FieldLabel htmlFor="text" className="sr-only">
            Meldung
          </FieldLabel>
          <Input
            name="text"
            id="text"
            type="text"
            placeholder="Meldung"
            autoComplete="off"
          />
        </Field>
        <Field className="w-25">
          <FieldLabel htmlFor="pressure" className="sr-only">
            Druck
          </FieldLabel>
          <Input
            name="pressure"
            id="pressure"
            type="number"
            placeholder="Druck"
            autoComplete="off"
          />
        </Field>
        <Button type="submit" size="icon" variant="secondary">
          <ArrowUpIcon className="size-4" />
        </Button>
      </form>
    </div>
  );
};
