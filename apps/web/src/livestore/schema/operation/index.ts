import { Events, Schema, State } from "@livestore/livestore";

export const operationsTable = State.SQLite.table({
  name: "operation",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    description: State.SQLite.text({ default: "" }),
    slug: State.SQLite.text({ default: "" }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    recordKeeper: State.SQLite.text({ nullable: true }),
    completedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
    archivedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
});

export type Operation = typeof operationsTable.Type;

export const operationsEvents = {
  operationCreated: Events.synced({
    name: "v1.OperationCreated",
    schema: Schema.Struct({
      id: Schema.String,
      description: Schema.String,
      slug: Schema.String,
      createdAt: Schema.Date,
      recordKeeper: Schema.String,
    }),
  }),
  recordKeeperUpdated: Events.synced({
    name: "v1.RecordKeeperUpdated",
    schema: Schema.Struct({ id: Schema.String, recordKeeper: Schema.String }),
  }),
  operationCompleted: Events.synced({
    name: "v1.OperationCompleted",
    schema: Schema.Struct({ id: Schema.String, completedAt: Schema.Date }),
  }),
  operationArchived: Events.synced({
    name: "v1.OperationArchived",
    schema: Schema.Struct({ id: Schema.String, archivedAt: Schema.Date }),
  }),
};

export const operationsMaterializers = State.SQLite.materializers(
  operationsEvents,
  {
    "v1.OperationCreated": ({
      id,
      description,
      slug,
      createdAt,
      recordKeeper,
    }) =>
      operationsTable.insert({
        id,
        description,
        slug,
        createdAt,
        recordKeeper,
      }),
    "v1.RecordKeeperUpdated": ({ id, recordKeeper }) =>
      operationsTable.update({ recordKeeper }).where({ id }),
    "v1.OperationCompleted": ({ id, completedAt }) =>
      operationsTable.update({ completedAt }).where({ id }),
    "v1.OperationArchived": ({ id, archivedAt }) =>
      operationsTable.update({ archivedAt }).where({ id }),
  }
);
