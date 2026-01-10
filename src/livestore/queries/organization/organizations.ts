import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const organizations$ = () => {
  return queryDb(
    tables.forces.select("organization").where({ archivedAt: null }),
    {
      label: "organizations",
    }
  );
};
