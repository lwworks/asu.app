import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const operation$ = (operationId: string) => {
  return queryDb(tables.operations.where({ id: operationId }).first(), {
    label: "operation",
  });
};
