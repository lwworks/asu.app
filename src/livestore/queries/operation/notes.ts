import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const operationNotes$ = (operationId: string) => {
  return queryDb(tables.operationNotes.where({ operationId }), {
    label: "operation-notes",
  });
};
