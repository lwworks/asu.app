import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const operationSquads$ = (operationId: string) => {
  return queryDb(tables.squads.where({ operationId }), {
    label: "operation-squads",
  });
};
