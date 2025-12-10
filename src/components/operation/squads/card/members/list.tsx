import type { SquadMember } from "@/livestore/schema/operation/squad-member";

export const MembersList = ({ members }: { members: SquadMember[] }) => {
  if (members.length === 0) return null;

  return (
    <div className="p-6 py-5 border-b">
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between">
            <div>
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
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">
                {member.startPressure} bar
              </div>
              <div className="text-xs text-muted-foreground">Startdruck</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
