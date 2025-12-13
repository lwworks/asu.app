import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { events } from "@/livestore/schema";
import type { Squad } from "@/livestore/schema/operation/squad";
import { useStore } from "@livestore/react";
import { useState } from "react";
import { SquadOptionsMenu } from "./options-menu";
import { StatusLabel } from "./status-label";

export const SquadHeader = ({ squad }: { squad: Squad }) => {
  const { store } = useStore();
  const [editSquadName, setEditSquadName] = useState(false);

  const handleSumbitSquadName = (name: string) => {
    if (!name) {
      setEditSquadName(false);
      return;
    }
    store.commit(events.squadNameUpdated({ id: squad.id, name }));
    setEditSquadName(false);
  };

  return (
    <CardHeader className="h-17 py-0! pr-4.5 flex items-center justify-between bg-white/4 flex-none border-b">
      <div className="flex items-center gap-4">
        {editSquadName ? (
          <Input
            name="name"
            id="name"
            placeholder="Trupp-Name"
            defaultValue={squad.name ?? ""}
            onBlur={() => setEditSquadName(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSumbitSquadName(event.currentTarget.value);
              }
            }}
            className="font-semibold leading-none text-lg! bg-transparent dark:bg-transparent border-none p-0 focus:ring-0 focus-visible:ring-0 w-48"
            autoFocus
            autoComplete="off"
          />
        ) : (
          <CardTitle>{squad.name}</CardTitle>
        )}
        <StatusLabel status={squad.status} />
      </div>
      <SquadOptionsMenu squad={squad} setEditSquadName={setEditSquadName} />
    </CardHeader>
  );
};
