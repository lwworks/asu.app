import { Events, Schema, State } from "@livestore/livestore";

export const squadLogsTable = State.SQLite.table({
  name: "squadLog",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    squadId: State.SQLite.text(),
    text: State.SQLite.text({ nullable: true }),
    pressure: State.SQLite.integer({ nullable: true }),
    timestamp: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
});

export type SquadLog = typeof squadLogsTable.Type;

export const squadLogsEvents = {
  squadLogCreatedWithText: Events.synced({
    name: "v1.SquadLogCreatedWithText",
    schema: Schema.Struct({
      id: Schema.String,
      squadId: Schema.String,
      text: Schema.String,
      timestamp: Schema.Date,
    }),
  }),
  squadLogCreatedWithPressure: Events.synced({
    name: "v1.SquadLogCreatedWithPressure",
    schema: Schema.Struct({
      id: Schema.String,
      squadId: Schema.String,
      pressure: Schema.Number,
      timestamp: Schema.Date,
    }),
  }),
  squadLogCreatedWithTextAndPressure: Events.synced({
    name: "v1.SquadLogCreatedWithTextAndPressure",
    schema: Schema.Struct({
      id: Schema.String,
      squadId: Schema.String,
      text: Schema.String,
      pressure: Schema.Number,
      timestamp: Schema.Date,
    }),
  }),
};

export const squadLogsMaterializers = State.SQLite.materializers(
  squadLogsEvents,
  {
    "v1.SquadLogCreatedWithText": ({ id, squadId, text, timestamp }) =>
      squadLogsTable.insert({
        id,
        squadId,
        text,
        timestamp,
      }),
    "v1.SquadLogCreatedWithPressure": ({ id, squadId, pressure, timestamp }) =>
      squadLogsTable.insert({
        id,
        squadId,
        pressure,
        timestamp,
      }),
    "v1.SquadLogCreatedWithTextAndPressure": ({
      id,
      squadId,
      text,
      pressure,
      timestamp,
    }) =>
      squadLogsTable.insert({
        id,
        squadId,
        text,
        pressure,
        timestamp,
      }),
  }
);
