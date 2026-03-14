import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const squadMembers$ = (squadId: string) => {
  return queryDb(tables.squadMembers.where({ squadId }), {
    label: "squad-members",
  });
};
