import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PauseIcon } from "lucide-react";
import { useState } from "react";

export const PauseOperationButton = ({ className }: { className?: string }) => {
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  const handlePauseOperation = () => {};

  const handleFirstClick = () => {
    setShowConfirmButton(true);
    setTimeout(() => {
      setShowConfirmButton(false);
    }, 2000);
  };

  return (
    <div className={cn("relative", className)}>
      <Button variant="outline" className="w-full" onClick={handleFirstClick}>
        <PauseIcon className="size-3.5" />
        <span>Einsatz pausieren</span>
      </Button>
      {showConfirmButton && (
        <div className="absolute inset-0 bg-card rounded-md overflow-hidden">
          <div className="bg-white/4">
            <Button
              disabled={true}
              className="bg-amber-200 hover:bg-amber-200/90 w-full"
              onClick={handlePauseOperation}
            >
              <PauseIcon className="size-3.5" />
              <span>Einsatz pausieren</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
