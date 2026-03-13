import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/cn";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { PauseIcon, XIcon } from "lucide-react";
import { useState } from "react";

export const PauseOperationButton = ({
  squadId,
  className,
}: {
  squadId: string;
  className?: string;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const [showForm, setShowForm] = useState(false);
  const [pressure, setPressure] = useState("");

  const handlePauseOperation = () => {
    const pressureValue = Number(pressure);
    if (!pressureValue || pressureValue <= 0) return;

    store.commit(
      events.squadPaused({
        id: squadId,
        pausedAt: currentTime,
        pressure: pressureValue,
      })
    );
    store.commit(
      events.squadLogCreatedWithTextAndPressure({
        id: crypto.randomUUID(),
        squadId,
        text: "Einsatz pausiert",
        pressure: pressureValue,
        timestamp: currentTime,
      })
    );
    setShowForm(false);
    setPressure("");
  };

  const handleFirstClick = () => {
    setShowForm(true);
  };

  return (
    <div className={cn(className)}>
      <Button variant="outline" className="w-full" onClick={handleFirstClick}>
        <PauseIcon className="size-3.5" />
        <span>Einsatz pausieren</span>
      </Button>
      {showForm && (
        <div className="absolute inset-0 bg-card rounded-md z-10">
          <div className="bg-white/4 flex gap-2 rounded-md h-full">
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => setShowForm(false)}>
              <XIcon className="size-3.5" />
            </Button>
            <Input
              type="number"
              placeholder="Restdruck"
              value={pressure}
              onChange={(e) => setPressure(e.target.value)}
              className="h-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePauseOperation();
                if (e.key === "Escape") {
                  setShowForm(false);
                  setPressure("");
                }
              }}
            />
            <div className="relative shrink-0">
              <Button
                variant="secondary"
                onClick={handlePauseOperation}
                disabled={!pressure || Number(pressure) <= 0}
              >
                <PauseIcon className="size-3.5" />
                <span>Pausieren</span>
              </Button>
              {(!pressure || Number(pressure) <= 0) && (
                <Tooltip>
                  <TooltipTrigger className="absolute inset-0" />
                  <TooltipContent>
                    <p>Es muss ein Restdruck zur Pause angegeben werden.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
