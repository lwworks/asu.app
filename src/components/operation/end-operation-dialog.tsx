import { useCurrentTime } from "@/context/current-time";
import { operationSquadsWithUncompletedEndPressures$ } from "@/livestore/queries/operation/squads-with-uncompleted-end-pressures";
import { events } from "@/livestore/schema";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { format } from "date-fns";
import { AlertTriangleIcon, InfoIcon, SquareIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export const EndOperationDialog = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const [open, setOpen] = useState(false);
  const squadsWithUncompletedEndPressures = store.useQuery(
    operationSquadsWithUncompletedEndPressures$(operation.id)
  );

  const activeSquads = squadsWithUncompletedEndPressures.filter(
    (squad) => squad.status === "active"
  );
  const endedSquads = squadsWithUncompletedEndPressures.filter(
    (squad) => squad.status === "ended"
  );

  const showError = activeSquads.length > 0 || endedSquads.length > 0;

  const handleCompleteOperation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    store.commit(
      events.operationCompleted({
        id: operation.id,
        completedAt: currentTime,
      })
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline-destructive">
          <SquareIcon className="size-3.5" />
          <span>Einsatz beenden</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 gap-0">
        <DialogHeader className="bg-white/4 p-6 border-b">
          <DialogTitle>Einsatz beenden</DialogTitle>
          <div className="text-sm text-muted-foreground">
            <span>{operation.description}</span>
            <span> vom </span>
            {format(operation.createdAt, "dd.MM.yyyy")}
            <span> um </span>
            <span>{format(operation.createdAt, "HH:mm")}</span>
            <span> Uhr</span>
          </div>
        </DialogHeader>
        <div className="h-64">
          {showError ? (
            <div className="p-6 bg-destructive/10 text-destructive border-y border-destructive -mt-px">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4" />
                <h3 className="font-medium">
                  Einsatz kann nicht beendet werden
                </h3>
              </div>
              {activeSquads.length > 0 ? (
                <ul className="text-sm list-disc mt-2 ml-6 list-inside">
                  {squadsWithUncompletedEndPressures.map((squad) => (
                    <li key={squad.id}>{squad.name} ist noch im Einsatz</li>
                  ))}
                </ul>
              ) : null}
              {endedSquads.length > 0 ? (
                <ul className="text-sm list-disc mt-2 ml-6 list-inside">
                  {squadsWithUncompletedEndPressures.map((squad) => (
                    <li key={squad.id}>Fehlender Endruck in {squad.name}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="p-6 text-sm flex items-center gap-2">
              <InfoIcon className="size-3.5" />
              <h3>
                Der Einsatz kann anschließend nicht mehr bearbeitet werden.
              </h3>
            </div>
          )}
        </div>
        <DialogFooter className="p-6 bg-white/4 border-t">
          <form
            className="flex gap-2 items-end w-full"
            onSubmit={handleCompleteOperation}
          >
            <Field className="w-36 shrink-0" data-disabled={showError}>
              <FieldLabel htmlFor="completed-at" className="font-normal">
                Einsatzende
              </FieldLabel>
              <Input
                name="completed-at"
                id="completed-at"
                type="text"
                disabled
                placeholder={format(currentTime, "dd.MM.yyyy HH:mm")}
              />
            </Field>
            <Button
              className="bg-destructive hover:bg-destructive/90 w-full flex-1"
              disabled={showError}
            >
              <SquareIcon className="size-3.5" />
              <span>Einsatz beenden</span>
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
