import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrentTime } from "@/context/current-time";
import { operationSquadCount$ } from "@/livestore/queries/operation/squad-count";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { PlusIcon } from "lucide-react";

export const NewSquadButton = ({ operationId }: { operationId: string }) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();

  const createSquad = () => {
    const squadId = crypto.randomUUID();
    const squadCount = store.query(operationSquadCount$(operationId));
    store.commit(
      events.squadCreated({
        id: squadId,
        name: `Trupp ${squadCount + 1}`,
        operationId,
        createdAt: currentTime,
        status: "standby",
        safetyTeam: false,
      })
    );
  };

  return (
    <Card className="bg-background w-96 shrink-0 flex items-center justify-center">
      <Button variant="ghost" onClick={createSquad}>
        <PlusIcon className="size-4" />
        <span>Trupp hinzufügen</span>
      </Button>
    </Card>
  );
};
