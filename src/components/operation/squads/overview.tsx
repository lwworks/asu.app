import { SquadCard } from "@/components/operation/squads/card";
import { operationSquads$ } from "@/livestore/queries/operation/squads";
import { useStore } from "@livestore/react";
import { NewSquadButton } from "./new-squad-button";

export const OperationSquads = ({ operationId }: { operationId: string }) => {
  const { store } = useStore();
  const squads = store.useQuery(operationSquads$(operationId));

  return (
    <section className="p-8 h-full overflow-x-auto">
      <div className="h-full flex gap-8 items-stretch">
        {squads.map((squad) => (
          <SquadCard key={squad.id} squad={squad} />
        ))}
        <NewSquadButton operationId={operationId} />
        <div className="w-px shrink-0" />
      </div>
    </section>
  );
};
