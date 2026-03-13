import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { EndOperationButton } from "./end-operation-button";
import { PauseOperationButton } from "./pause-operation-button";
import { ResumeOperationButton } from "./resume-operation-button";
import { StartOperationForm } from "./start-operation-form";

export const SquadActions = ({
  squad,
  members,
}: {
  squad: Squad;
  members: SquadMember[];
}) => {
  return (
    <div className="relative grid grid-cols-2 gap-2">
      {squad.status === "standby" && (
        <StartOperationForm squadId={squad.id} memberCount={members.length} />
      )}
      {squad.status === "active" && (
        <>
          <PauseOperationButton
            squadId={squad.id}
          />
          <EndOperationButton
            squadId={squad.id}
          />
        </>
      )}
      {squad.status === "paused" && (
        <>
          <ResumeOperationButton
            squad={squad}
          />
          <EndOperationButton
            squadId={squad.id}
          />
        </>
      )}
    </div>
  );
};
