import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";

export const operations$ = () => {
  return queryDb(tables.operations.orderBy("createdAt", "desc"), {
    label: "operations",
  });
};
