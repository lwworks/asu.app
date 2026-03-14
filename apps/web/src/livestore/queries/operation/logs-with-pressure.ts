import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const logsWithPressure$ = (squadId: string) => {
  return queryDb(
    tables.squadLogs
      .where({ squadId })
      .where("pressure", "!=", null)
      .orderBy("timestamp", "desc"),
    {
      label: "squad-logs",
    }
  );
};
