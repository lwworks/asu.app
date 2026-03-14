import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const forceById$ = (id: string) => {
  return queryDb(tables.forces.where({ id }).first(), {
    label: "force-by-id",
  });
};
