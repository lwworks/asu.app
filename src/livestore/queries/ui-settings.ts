import { queryDb } from "@livestore/livestore";
import { tables } from "../schema";

export const uiSettings$ = queryDb(tables.uiSettings.get(), {
  label: "ui-settings",
});
