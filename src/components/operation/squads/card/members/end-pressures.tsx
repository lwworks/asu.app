import { cn } from "@/lib/cn";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { EndPressureForm } from "./end-pressure-form";

export const EndPressures = ({
  squadId,
  members,
  className,
}: {
  squadId: string;
  members: SquadMember[];
  className?: string;
}) => {
  const membersWithoutEndPressure = members.filter(
    (member) => member.endPressure === null
  );

  if (membersWithoutEndPressure.length === 0) return null;

  return (
    <div className={cn("w-full space-y-2", className)}>
      {membersWithoutEndPressure.map((member) => (
        <EndPressureForm key={member.id} squadId={squadId} member={member} />
      ))}
    </div>
  );
};
