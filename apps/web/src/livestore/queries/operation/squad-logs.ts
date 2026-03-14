import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const squadLogs$ = (squadId: string) => {
  return queryDb(tables.squadLogs.where({ squadId }), {
    label: "squad-logs",
  });
};
