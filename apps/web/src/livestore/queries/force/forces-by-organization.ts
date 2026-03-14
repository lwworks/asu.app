import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const forcesByOrganization$ = (organization: string) => {
  const query: Record<string, any> = { archivedAt: null };
  if (organization !== "all") query.organization = organization;

  return queryDb(tables.forces.where(query), {
    label: "forces-by-organization",
  });
};
