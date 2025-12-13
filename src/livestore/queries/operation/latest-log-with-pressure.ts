import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const latestLogWithPressure$ = (squadId: string) => {
  return queryDb(
    tables.squadLogs
      .where({ squadId })
      .where("pressure", "!=", null)
      .orderBy("timestamp", "desc")
      .first(),
    {
      label: "squad-logs",
    }
  );
};
