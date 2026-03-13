import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentTime } from "@/context/current-time";
import { operationSquads$ } from "@/livestore/queries/operation/squads";
import { events } from "@/livestore/schema";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { CheckIcon } from "lucide-react";
import { useState } from "react";

export const CompleteOperation = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const squads = store.useQuery(operationSquads$(operation.id));
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  const blockingSquads = squads.filter(
    (s) => s.status === "active" || s.status === "paused"
  );
  const isBlocked = blockingSquads.length > 0;

  const handleComplete = () => {
    store.commit(
      events.operationCompleted({
        id: operation.id,
        completedAt: currentTime,
      })
    );
  };

  const handleFirstClick = () => {
    setShowConfirmButton(true);
    setTimeout(() => {
      setShowConfirmButton(false);
    }, 2000);
  };

  return (
    <div>
      <div className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
        Einsatz beenden
      </div>
      <div className="relative">
        <div className="relative">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleFirstClick}
            disabled={isBlocked}
          >
            <CheckIcon className="size-3.5" />
            <span>Einsatz beenden</span>
          </Button>
          {isBlocked && (
            <Tooltip>
              <TooltipTrigger className="absolute inset-0" />
              <TooltipContent>
                <p>
                  Es gibt noch {blockingSquads.length} aktive/pausierte Trupp
                  {blockingSquads.length !== 1 ? "s" : ""}.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {showConfirmButton && (
          <div className="absolute inset-0 bg-card rounded-md overflow-hidden">
            <div className="bg-white/4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleComplete}
              >
                <CheckIcon className="size-3.5" />
                <span>Beenden bestätigen</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
