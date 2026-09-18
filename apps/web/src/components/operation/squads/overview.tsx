import { SquadCard } from "@/components/operation/squads/card";
import { operationSquads$ } from "@/livestore/queries/operation/squads";
import { uiSettings$ } from "@/livestore/queries/ui-settings";
import { useStore } from "@livestore/react";
import { useMemo } from "react";
import { NewSquadButton } from "./new-squad-button";

const statusOrder = {
  active: 0,
  paused: 1,
  standby: 2,
  ended: 3,
  archived: 4,
};

export const OperationSquads = ({
  operationId,
  readOnly = false,
}: {
  operationId: string;
  readOnly?: boolean;
}) => {
  const { store } = useStore();
  const squads = store.useQuery(operationSquads$(operationId));
  const uiSettings = store.useQuery(uiSettings$);

  const sortedSquads = useMemo(() => {
    return [...squads].sort((a, b) => {
      if (uiSettings?.squadOrder === "createdAt") {
        return a.createdAt.getTime() - b.createdAt.getTime();
      } else if (uiSettings?.squadOrder === "alphabetical") {
        return a.name.localeCompare(b.name);
      } else {
        return statusOrder[a.status] - statusOrder[b.status];
      }
    });
  }, [squads, uiSettings]);

  return (
    <section className="p-8 h-full overflow-x-auto">
      <div className="h-full flex gap-8 items-stretch">
        {sortedSquads.map((squad) => (
          <SquadCard key={squad.id} squad={squad} readOnly={readOnly} />
        ))}
        {!readOnly && <NewSquadButton operationId={operationId} />}
        <div className="w-px shrink-0" />
      </div>
    </section>
  );
};
