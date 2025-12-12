import { operationSquadsWithUncompletedEndPressures$ } from "@/livestore/queries/operation/squads-with-uncompleted-end-pressures";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { format } from "date-fns";
import { AlertTriangleIcon, SquareIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export const EndOperationDialog = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const squadsWithUncompletedEndPressures = store.useQuery(
    operationSquadsWithUncompletedEndPressures$(operation.id)
  );

  const showError = squadsWithUncompletedEndPressures.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive border-destructive dark:border-destructive"
        >
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
            <span> am </span>
            <span>{format(operation.createdAt, "HH:mm")}</span>
            <span> Uhr</span>
          </div>
        </DialogHeader>
        <div className="h-64">
          {showError && (
            <div className="p-6 bg-destructive/10 text-destructive border-y border-destructive -mt-px">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4" />
                <h3 className="font-medium">
                  Einsatz kann nicht beendet werden
                </h3>
              </div>
              {squadsWithUncompletedEndPressures.length > 0 ? (
                <ul className="text-sm list-disc mt-2 ml-6 list-inside">
                  {squadsWithUncompletedEndPressures.map((squad) => (
                    <li key={squad.id}>Fehlender Endruck in {squad.name}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
