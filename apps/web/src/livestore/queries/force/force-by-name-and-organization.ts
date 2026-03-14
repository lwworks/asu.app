import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const forceByNameAndOrganization$ = (
  name: string,
  organization: string
) => {
  return queryDb(
    tables.forces.where({ name, organization, archivedAt: null }),
    {
      label: "force-by-name-and-organization",
    }
  );
};
