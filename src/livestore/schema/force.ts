import { Events, Schema, State } from "@livestore/livestore";

export const forcesTable = State.SQLite.table({
  name: "forces",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text(),
    organization: State.SQLite.text({ nullable: true }),
    annualTraining: State.SQLite.integer({
      schema: Schema.DateFromNumber,
      nullable: true,
    }),
    medicalCheck: State.SQLite.integer({
      schema: Schema.DateFromNumber,
      nullable: true,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    archivedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
      nullable: true,
    }),
  },
});

export type Force = typeof forcesTable.Type;

export const forcesEvents = {
  forceCreated: Events.synced({
    name: "v1.ForceCreated",
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      organization: Schema.String,
      annualTraining: Schema.Date,
      medicalCheck: Schema.Date,
      updatedAt: Schema.Date,
    }),
  }),
  forceUpdated: Events.synced({
    name: "v1.ForceUpdated",
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      organization: Schema.String,
      annualTraining: Schema.Date,
      medicalCheck: Schema.Date,
      updatedAt: Schema.Date,
    }),
  }),
  forceArchived: Events.synced({
    name: "v1.ForceArchived",
    schema: Schema.Struct({
      id: Schema.String,
      archivedAt: Schema.Date,
    }),
  }),
};

export const forcesMaterializers = State.SQLite.materializers(forcesEvents, {
  "v1.ForceCreated": ({
    id,
    name,
    organization,
    annualTraining,
    medicalCheck,
    updatedAt,
  }) =>
    forcesTable.insert({
      id,
      name,
      organization,
      annualTraining,
      medicalCheck,
      updatedAt,
    }),
  "v1.ForceUpdated": ({
    id,
    name,
    organization,
    annualTraining,
    medicalCheck,
    updatedAt,
  }) =>
    forcesTable
      .update({ name, organization, annualTraining, medicalCheck, updatedAt })
      .where({ id }),
  "v1.ForceArchived": ({ id, archivedAt }) =>
    forcesTable.update({ archivedAt }).where({ id }),
});
