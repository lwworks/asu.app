import { cn } from "@/lib/cn";
import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { useEffect, useState } from "react";
import { MembersList } from "./list";
import { MemberForm } from "./member-form";
import { NewMemberBackdrop } from "./new-member-backdrop";
import { NewMemberButton } from "./new-member-button";

export const SquadMembers = ({
  squad,
  members,
}: {
  squad: Squad;
  members: SquadMember[];
}) => {
  const [showNewMemberButton, setShowNewMemberButton] = useState(true);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<SquadMember | null>(null);

  useEffect(() => {
    if (memberToEdit) {
      setShowMemberForm(true);
      return;
    }
    if (members.length < 2) {
      setShowNewMemberButton(false);
      setShowMemberForm(true);
    } else {
      setShowMemberForm(false);
      setShowNewMemberButton(true);
    }
  }, [members.length, memberToEdit]);

  return (
    <>
      <MembersList
        members={members}
        setMemberToEdit={setMemberToEdit}
        status={squad.status}
      />
      {squad.status !== "ended" && (
        <div className="relative">
          {showNewMemberButton && (
            <NewMemberButton
              onClick={() => {
                setShowMemberForm(true);
              }}
            />
          )}
          {showMemberForm && members.length > 1 && <NewMemberBackdrop />}
          {showMemberForm && (
            <div
              className={cn(
                members.length > 1 && "absolute inset-x-0 top-0 bg-card z-20"
              )}
            >
              <MemberForm
                squadId={squad.id}
                members={members}
                memberToEdit={memberToEdit}
                setMemberToEdit={setMemberToEdit}
                onCloseClick={() => {
                  setShowMemberForm(false);
                  setMemberToEdit(null);
                }}
                className={cn(members.length < 2 && "pt-3")}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
