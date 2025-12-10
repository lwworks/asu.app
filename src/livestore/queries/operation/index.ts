import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const operation$ = (operationSlug: string) => {
  return queryDb(tables.operations.where({ slug: operationSlug }).first(), {
    label: "operation",
  });
};
