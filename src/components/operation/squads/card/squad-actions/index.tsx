import { Button } from "@/components/ui/button";
import type { Squad } from "@/livestore/schema/operation/squad";
import { PauseIcon, SquareIcon } from "lucide-react";
import { StartOperationButton } from "./start-operation-button";

export const SquadActions = ({ squad }: { squad: Squad }) => {
  return (
    <>
      <div className="p-6 bg-white/4 flex gap-2 border-t">
        {squad.status === "standby" && (
          <StartOperationButton squadId={squad.id} />
        )}
        {squad.status === "active" && (
          <>
            <Button variant="outline" size="lg">
              <PauseIcon className="size-3.5" />
              <span>Einsatz pausieren</span>
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90"
              size="lg"
            >
              <SquareIcon className="size-3.5" />
              <span>Einsatz beenden</span>
            </Button>
          </>
        )}
      </div>
    </>
  );
};
