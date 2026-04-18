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
          {duration(operation.createdAt, operation.completedAt ?? currentTime)}
        </div>
        <div className="text-sm uppercase tracking-wider text-muted-foreground">
          Einsatzdauer
        </div>
      </div>
      <div className="p-6 border-r">
        <div className="text-3xl font-mono">
          {activeSquads.length}
        </div>
        <div className="text-sm uppercase tracking-wider text-muted-foreground">
          Trupp{activeSquads.length !== 1 ? "s" : ""} eingesetzt
        </div>
      </div>
    </Card>
  )
}