import { Schema, SessionIdSymbol, State } from "@livestore/livestore";

export type Mode = "desktop" | "tablet-only" | "tablet-additional";
export type Theme = "light" | "dark" | "system";
export type FontSize = "default" | "lg" | "xl";
export type SquadOrder = "status" | "createdAt" | "alphabetical";

export const uiSettingsTable = State.SQLite.clientDocument({
  name: "uiSettings",
  schema: Schema.Struct({
    mode: Schema.Literal("desktop", "tablet-only", "tablet-additional"),
    theme: Schema.Literal("light", "dark", "system"),
    fontSize: Schema.Literal("default", "lg", "xl"),
    squadOrder: Schema.Literal("status", "createdAt", "alphabetical"),
  }),
  default: {
    id: SessionIdSymbol,
    value: {
      mode: "desktop",
      theme: "dark",
      fontSize: "default",
      squadOrder: "createdAt",
    },
  },
});

export const uiSettingsEvents = {
  uiSettingsUpdated: uiSettingsTable.set,
};
