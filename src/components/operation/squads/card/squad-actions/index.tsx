import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { EmailReportForm } from "./email-report-form";
import { EndOperationButton } from "./end-operation-button";
import { PauseOperationButton } from "./pause-operation-button";
import { StartOperationButton } from "./start-operation-button";

export const SquadActions = ({
  squad,
  members,
}: {
  squad: Squad;
  members: SquadMember[];
}) => {
  const membersWithoutEndPressure = members.filter(
    (member) => member.endPressure === null
  ).length;

  return (
    <div className="flex gap-2">
      {squad.status === "standby" && (
        <StartOperationButton squadId={squad.id} />
      )}
      {squad.status === "active" && (
        <>
          <PauseOperationButton
            squadId={squad.id}
            className="w-[calc(50%-4px)]"
          />
          <EndOperationButton
            squadId={squad.id}
            className="w-[calc(50%-4px)]"
          />
        </>
      )}
      {squad.status === "ended" && membersWithoutEndPressure === 0 && (
        <EmailReportForm squadId={squad.id} />
      )}
    </div>
  );
};
