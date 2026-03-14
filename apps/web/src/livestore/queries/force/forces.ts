import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const forces$ = () => {
  return queryDb(tables.forces.where({ archivedAt: null }), {
    label: "forces",
  });
};
