import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const operationSquadCount$ = (operationId: string) => {
  return queryDb(
    tables.squads.where({ operationId, archivedAt: null }).count(),
    {
      label: "operation-squad-count",
    }
  );
};
