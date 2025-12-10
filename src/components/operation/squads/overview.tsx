import { SquadCard } from "@/components/operation/squads/card";
import { operationSquads$ } from "@/livestore/queries/operation/squads";
import { useStore } from "@livestore/react";
import { NewSquad } from "./new-squad";

export const OperationSquads = ({ operationId }: { operationId: string }) => {
  const { store } = useStore();
  const squads = store.useQuery(operationSquads$(operationId));

  return (
    <section className="p-8 gap-8 h-full flex items-stretch">
      {squads.map((squad) => (
        <SquadCard key={squad.id} squad={squad} />
      ))}
      <NewSquad operationId={operationId} />
    </section>
  );
};
