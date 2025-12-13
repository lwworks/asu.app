import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { squadMembers$ } from "@/livestore/queries/operation/squad-members";
import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { useStore } from "@livestore/react";
import { useRef } from "react";
import { SquadHeader } from "./header";
import { SquadLogs } from "./logs";
import { SquadMembers } from "./members";
import { EndPressures } from "./members/end-pressures";
import { SquadActions } from "./squad-actions";
import { SquadStats } from "./stats";

export const SquadCard = ({ squad }: { squad: Squad }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { store } = useStore();
  const members = store.useQuery(squadMembers$(squad.id)) as SquadMember[];
  const showStats = squad.status === "active";

  return (
    <Card
      ref={cardRef}
      className="w-96 shrink-0 py-0 gap-0 h-full flex flex-col overflow-hidden"
    >
      <SquadHeader squad={squad} />
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <SquadMembers squad={squad} members={members} />
        {showStats && <SquadStats squad={squad} members={members} />}
        <SquadLogs squadId={squad.id} />
      </CardContent>
      <CardFooter className="block p-6 bg-white/4 border-t flex-none">
        {squad.status === "ended" && (
          <EndPressures squadId={squad.id} members={members} />
        )}
        <SquadActions squad={squad} members={members} />
      </CardFooter>
    </Card>
  );
};
