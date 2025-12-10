import { cn } from "@/lib/cn";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { ArrowRightIcon, PencilIcon } from "lucide-react";

export const MembersList = ({
  members,
  setMemberToEdit,
  status,
}: {
  members: SquadMember[];
  setMemberToEdit: (member: SquadMember) => void;
  status: string;
}) => {
  if (members.length === 0) return null;

  return (
    <div className={cn("p-6 py-5", status === "ended" ? "pb-0" : "border-b")}>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between">
            <button
              className="relative group cursor-pointer text-left"
              onClick={() => setMemberToEdit(member)}
            >
              <div className="absolute w-6 inset-y-0 -left-6 pt-1 justify-center hidden group-hover:flex">
                <PencilIcon className="size-3 text-muted-foreground/50" />
              </div>
              <div className="text-sm">
                <span>{member.name}</span>
                {member.isLeader ? (
                  <span className="ml-1 h-4 inline-flex items-center bg-zinc-700 font-medium rounded-full px-2 text-xs">
                    TF
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {member.organization}
              </div>
            </button>
            <div className="flex">
              <div className="text-right">
                <div className="text-sm font-mono">
                  {member.startPressure} bar
                </div>
                <div className="text-xs text-muted-foreground">Startdruck</div>
              </div>
              {member.endPressure && (
                <div className="text-right ml-1">
                  <div className="text-sm font-mono flex items-center gap-1">
                    <ArrowRightIcon className="size-4 text-muted-foreground/50" />
                    <span>{member.endPressure} bar</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Enddruck</div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
