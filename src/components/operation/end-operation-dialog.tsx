import { useCurrentTime } from "@/context/current-time";
import { operationSquads$ } from "@/livestore/queries/operation/squads";
import { events } from "@/livestore/schema";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { format, parse } from "date-fns";
import { SquareIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export const EndOperationCard = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const squads = store.useQuery(operationSquads$(operation.id));

  const [endTimeInput, setEndTimeInput] = useState(
    format(currentTime, "dd.MM.yyyy HH:mm")
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const activeSquads = squads.filter(
    (s) => s.startedAt && s.status !== "ended" && s.status !== "archived"
  );
  const isBlocked = activeSquads.length > 0;

  const latestSquadEndTime = squads.reduce<Date | null>((latest, squad) => {
    if (!squad.endedAt) return latest;
    if (!latest || squad.endedAt > latest) return squad.endedAt;
    return latest;
  }, null);

  const parsedEndTime = parse(endTimeInput, "dd.MM.yyyy HH:mm", new Date());
  const isValidTime =
    !isNaN(parsedEndTime.getTime()) &&
    (!latestSquadEndTime || parsedEndTime >= latestSquadEndTime);

  const handleCompleteOperation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBlocked || !isValidTime) return;
    store.commit(
      events.operationCompleted({
        id: operation.id,
        completedAt: parsedEndTime,
      })
    );
  };

  const handleFirstClick = () => {
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Einsatz beenden</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isBlocked
            ? "Der Einsatz kann nicht beendet werden, wenn nicht alle Trupps ihren Einsatz beendet haben."
            : "Der Einsatz kann danach nicht mehr bearbeitet werden."}
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="flex gap-2 items-end"
          onSubmit={handleCompleteOperation}
        >
          <Field className="w-44 shrink-0">
            <FieldLabel htmlFor="completed-at" className="font-normal">
              Einsatzende
            </FieldLabel>
            <Input
              name="completed-at"
              id="completed-at"
              type="text"
              value={endTimeInput}
              onChange={(e) => {
                setEndTimeInput(e.target.value);
                setShowConfirm(false);
              }}
              disabled={isBlocked}
              placeholder="dd.MM.yyyy HH:mm"
            />
          </Field>
          <div className="relative flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleFirstClick}
              disabled={isBlocked || !isValidTime}
            >
              <SquareIcon className="size-3.5" />
              <span>Einsatz beenden</span>
            </Button>
            {showConfirm && (
              <div className="absolute inset-0 bg-card rounded-md overflow-hidden">
                <div className="bg-white/4">
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                    disabled={!isValidTime}
                  >
                    <SquareIcon className="size-3.5" />
                    <span>Beenden bestätigen</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
        {!isBlocked &&
          !isNaN(parsedEndTime.getTime()) &&
          latestSquadEndTime &&
          parsedEndTime < latestSquadEndTime && (
            <p className="text-sm text-destructive mt-2">
              Das Einsatzende darf nicht vor dem letzten Trupp-Ende (
              {format(latestSquadEndTime, "dd.MM.yyyy HH:mm")}) liegen.
            </p>
          )}
      </CardContent>
    </Card>
  );
};
