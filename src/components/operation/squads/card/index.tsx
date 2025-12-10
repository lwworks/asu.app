import { StatusLabel } from "@/components/operation/squads/card/status-label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { squadMembers$ } from "@/livestore/queries/operation/squad-members";
import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { useStore } from "@livestore/react";
import { useEffect, useRef, useState } from "react";
import { SquadLogs } from "./logs";
import { MembersList } from "./members/list";
import { MemberForm } from "./members/member-form";
import { NewMemberButton } from "./members/new-member-button";
import { SquadActions } from "./squad-actions";
import { SquadStats } from "./stats";

export const SquadCard = ({ squad }: { squad: Squad }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { store } = useStore();
  const members = store.useQuery(squadMembers$(squad.id)) as SquadMember[];

  const [showNewMemberButton, setShowNewMemberButton] = useState(true);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const showStats = squad.status === "active";

  useEffect(() => {
    if (members.length < 2) {
      setShowNewMemberButton(false);
      setShowMemberForm(true);
    } else {
      setShowMemberForm(false);
      setShowNewMemberButton(true);
    }
  }, [members.length]);

  return (
    <Card
      ref={cardRef}
      className="w-96 py-0 gap-0 h-full flex flex-col overflow-y-auto"
    >
      <CardHeader className="py-6 flex items-center justify-between bg-white/4 flex-none border-b">
        <CardTitle>{squad.name}</CardTitle>
        <StatusLabel status={squad.status} />
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col h-full">
        <MembersList members={members} />
        {showNewMemberButton && (
          <NewMemberButton
            onClick={() => {
              setShowMemberForm(true);
              setShowNewMemberButton(false);
            }}
          />
        )}
        {showMemberForm && (
          <MemberForm
            squadId={squad.id}
            members={members}
            onCloseClick={() => {
              setShowMemberForm(false);
              setShowNewMemberButton(true);
            }}
          />
        )}
        {showStats && <SquadStats squad={squad} members={members} />}
        {showLogs && <SquadLogs squadId={squad.id} />}
      </CardContent>
      <CardFooter className="block p-0 flex-none">
        <SquadActions squad={squad} />
      </CardFooter>
    </Card>
  );
};
