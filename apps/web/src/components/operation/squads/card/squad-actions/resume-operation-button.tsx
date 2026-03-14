import { Button } from "@/components/ui/button";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/cn";
import { events } from "@/livestore/schema";
import type { Squad } from "@/livestore/schema/operation/squad";
import { useStore } from "@livestore/react";
import { PlayIcon } from "lucide-react";
import { useState } from "react";

export const ResumeOperationButton = ({
  squad,
  className,
}: {
  squad: Squad;
  className?: string;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  const handleResumeOperation = () => {
    const pausedMs = squad.pausedAt
      ? currentTime.getTime() - squad.pausedAt.getTime()
      : 0;
    const newTotalPausedMs = (squad.totalPausedMs ?? 0) + pausedMs;

    store.commit(
      events.squadResumed({
        id: squad.id,
        resumedAt: currentTime,
        totalPausedMs: newTotalPausedMs,
      })
    );
    store.commit(
      events.squadLogCreatedWithText({
        id: crypto.randomUUID(),
        squadId: squad.id,
        text: "Einsatz fortgesetzt",
        timestamp: currentTime,
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
    <div className={cn("relative", className)}>
      <Button variant="outline" className="w-full" onClick={handleFirstClick}>
        <PlayIcon className="size-3.5" />
        <span>Fortsetzen</span>
      </Button>
      {showConfirmButton && (
        <div className="absolute inset-0 bg-card rounded-md overflow-hidden">
          <div className="bg-white/4">
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleResumeOperation}
            >
              <PlayIcon className="size-3.5" />
              <span>Bestätigen</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
