import { operationSquads$ } from "@/livestore/queries/operation/squads";
import { useStore } from "@livestore/react";
import { SquadCard } from "./card";

export const OperationSquads = ({ operationId }: { operationId: string }) => {
  const { store } = useStore();
  const squads = store.query(operationSquads$(operationId));

  console.log(squads);

  return (
    <section className="p-8 flex gap-8">
      {squads.map((squad) => (
        <SquadCard key={squad.id} squad={squad} />
      ))}
    </section>
  );
};
