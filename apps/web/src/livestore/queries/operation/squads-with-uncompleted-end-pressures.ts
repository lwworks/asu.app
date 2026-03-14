import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const operationSquadsWithUncompletedEndPressures$ = (
  operationId: string
) => {
  return queryDb(
    tables.squads
      .where({ operationId, endPressuresCompletedAt: null })
      .where("startedAt", "!=", null),
    {
      label: "operation-squads-with-uncompleted-end-pressures",
    }
  );
};
