import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const lowestStartPressure$ = (squadId: string) => {
  return queryDb(
    tables.squadMembers
      .where({ squadId })
      .orderBy("startPressure", "asc")
      .first(),
    {
      label: "lowest-start-pressure",
    }
  );
};
