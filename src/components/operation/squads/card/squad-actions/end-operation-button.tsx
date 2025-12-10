import { Button } from "@/components/ui/button";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/cn";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { SquareIcon } from "lucide-react";
import { useState } from "react";

export const EndOperationButton = ({
  squadId,
  className,
}: {
  squadId: string;
  className?: string;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  const handleEndOperation = () => {
    store.commit(events.squadEnded({ id: squadId, endedAt: currentTime }));
    store.commit(
      events.squadLogCreatedWithText({
        id: crypto.randomUUID(),
        squadId,
        text: "Einsatz beendet",
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
        <SquareIcon className="size-3.5" />
        <span>Einsatz beenden</span>
      </Button>
      {showConfirmButton && (
        <div className="absolute inset-0 bg-card rounded-md overflow-hidden">
          <div className="bg-white/4">
            <Button
              className="bg-destructive hover:bg-destructive/90 w-full"
              onClick={handleEndOperation}
            >
              <SquareIcon className="size-3.5" />
              <span>Einsatz beenden</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
