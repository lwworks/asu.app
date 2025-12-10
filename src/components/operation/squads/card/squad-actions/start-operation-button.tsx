import { Button } from "@/components/ui/button";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/utils";
import { lowestStartPressure$ } from "@/livestore/queries/operation/lowest-start-pressure";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { PlayIcon } from "lucide-react";

export const StartOperationButton = ({
  squadId,
  className,
}: {
  squadId: string;
  className?: string;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();

  const handleStartOperation = () => {
    const { startPressure } = store.query(lowestStartPressure$(squadId));
    store.commit(events.squadStarted({ id: squadId, startedAt: currentTime }));
    store.commit(
      events.squadLogCreatedWithTextAndPressure({
        id: crypto.randomUUID(),
        squadId,
        text: "Einsatz gestartet",
        pressure: startPressure,
        timestamp: currentTime,
      })
    );
  };

  return (
    <Button
      className={cn("bg-emerald-300 hover:bg-emerald-300/90 w-full", className)}
      onClick={handleStartOperation}
    >
      <PlayIcon className="size-3.5" />
      <span>Einsatz starten</span>
    </Button>
  );
};
