import { Card } from "@/components/ui/card";
import { useCurrentTime } from "@/context/current-time";
import { duration } from "@/lib/duration";
import { operationSquads$ } from "@/livestore/queries/operation/squads";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";

export const OperationStats = ({ operation }: { operation: Operation }) => {
  const { currentTime } = useCurrentTime();
  const { store } = useStore();
  const squads = store.useQuery(operationSquads$(operation.id));

  const activeSquads = squads.filter(squad => squad.startedAt);

  return (
    <Card className="p-0 grid grid-cols-4 gap-0">
      <div className="p-6 border-r">
        <div className="text-3xl font-mono">
          {duration(operation.createdAt, currentTime)}
        </div>
        <div className="text-sm uppercase tracking-wider text-muted-foreground mt-1">
          Einsatzdauer
        </div>
      </div>
      <div className="p-6 border-r">
        <div className="text-3xl font-mono text-muted-foreground">
          <span className="text-primary">{activeSquads.length}</span>
          <span>/</span>
          <span>{squads.length}</span>
        </div>
        <div className="text-sm uppercase tracking-wider text-muted-foreground mt-1">
          Trupp{activeSquads.length !== 1 ? "s" : ""} eingesetzt
        </div>
      </div>
    </Card>
  )
}