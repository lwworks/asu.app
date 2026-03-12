import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { EndOperationButton } from "./end-operation-button";
import { PauseOperationButton } from "./pause-operation-button";
import { StartOperationForm } from "./start-operation-form";

export const SquadActions = ({
  squad,
  members,
}: {
  squad: Squad;
  members: SquadMember[];
}) => {
  return (
    <div className="flex gap-2">
      {squad.status === "standby" && (
        <StartOperationForm squadId={squad.id} memberCount={members.length} />
      )}
      {squad.status === "active" && (
        <>
          <PauseOperationButton className="w-[calc(50%-4px)]" />
          <EndOperationButton
            squadId={squad.id}
            className="w-[calc(50%-4px)]"
          />
        </>
      )}
    </div>
  );
};
