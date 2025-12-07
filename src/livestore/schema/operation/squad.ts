import { Events, Schema, State } from "@livestore/livestore";

export const squadsTable = State.SQLite.table({
  name: "squad",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text(),
    operationId: State.SQLite.text(),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    status: State.SQLite.text({
      schema: Schema.Literal("active", "standby", "ended"),
    }),
    safetyTeam: State.SQLite.boolean(),
    startedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
      nullable: true,
    }),
    endedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
      nullable: true,
    }),
  },
});

export type Squad = typeof squadsTable.Type;

export const squadsEvents = {
  squadCreated: Events.synced({
    name: "v1.SquadCreated",
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      operationId: Schema.String,
      createdAt: Schema.Date,
      status: Schema.Literal("active", "standby", "ended"),
      safetyTeam: Schema.Boolean,
    }),
  }),
};

export const squadsMaterializers = State.SQLite.materializers(squadsEvents, {
  "v1.SquadCreated": ({
    id,
    name,
    operationId,
    createdAt,
    status,
    safetyTeam,
  }) =>
    squadsTable.insert({
      id,
      name,
      operationId,
      createdAt,
      status,
      safetyTeam,
    }),
});
