import { Events, Schema, State } from "@livestore/livestore";

export const operationNotesTable = State.SQLite.table({
  name: "operationNote",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    operationId: State.SQLite.text(),
    text: State.SQLite.text(),
    timestamp: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
});

export type OperationNote = typeof operationNotesTable.Type;

export const operationNotesEvents = {
  operationNoteCreated: Events.synced({
    name: "v1.OperationNoteCreated",
    schema: Schema.Struct({
      id: Schema.String,
      operationId: Schema.String,
      text: Schema.String,
      timestamp: Schema.Date,
    }),
  }),
};

export const operationNotesMaterializers = State.SQLite.materializers(
  operationNotesEvents,
  {
    "v1.OperationNoteCreated": ({ id, operationId, text, timestamp }) =>
      operationNotesTable.insert({ id, operationId, text, timestamp }),
  }
);
