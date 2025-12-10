import { Events, Schema, State } from "@livestore/livestore";

export const squadMembersTable = State.SQLite.table({
  name: "squadMember",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    squadId: State.SQLite.text(),
    name: State.SQLite.text(),
    organization: State.SQLite.text({ nullable: true }),
    equipmentId: State.SQLite.text({ nullable: true }),
    isLeader: State.SQLite.boolean({ default: false }),
    startPressure: State.SQLite.integer(),
    endPressure: State.SQLite.integer({ nullable: true }),
    removedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
      nullable: true,
    }),
  },
});

export type SquadMember = typeof squadMembersTable.Type;

export const squadMembersEvents = {
  squadMemberCreated: Events.synced({
    name: "v1.SquadMemberCreated",
    schema: Schema.Struct({
      id: Schema.String,
      squadId: Schema.String,
      name: Schema.String,
      organization: Schema.String,
      equipmentId: Schema.String,
      isLeader: Schema.Boolean,
      startPressure: Schema.Number,
    }),
  }),
  squadMemberUpdated: Events.synced({
    name: "v1.SquadMemberUpdated",
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      organization: Schema.String,
      equipmentId: Schema.String,
      isLeader: Schema.Boolean,
      startPressure: Schema.Number,
    }),
  }),
  squadMemberRemoved: Events.synced({
    name: "v1.SquadMemberRemoved",
    schema: Schema.Struct({
      id: Schema.String,
      removedAt: Schema.Date,
    }),
  }),
  squadMemberStartPressureUpdated: Events.synced({
    name: "v1.SquadMemberStartPressureUpdated",
    schema: Schema.Struct({
      id: Schema.String,
      startPressure: Schema.Number,
    }),
  }),
  squadMemberEndPressureUpdated: Events.synced({
    name: "v1.SquadMemberEndPressureUpdated",
    schema: Schema.Struct({
      id: Schema.String,
      endPressure: Schema.Number,
    }),
  }),
};

export const squadMembersMaterializers = State.SQLite.materializers(
  squadMembersEvents,
  {
    "v1.SquadMemberCreated": ({
      id,
      squadId,
      name,
      organization,
      equipmentId,
      isLeader,
      startPressure,
    }) =>
      squadMembersTable.insert({
        id,
        squadId,
        name,
        organization,
        equipmentId,
        isLeader,
        startPressure,
      }),
    "v1.SquadMemberUpdated": ({
      id,
      name,
      organization,
      equipmentId,
      isLeader,
      startPressure,
    }) =>
      squadMembersTable
        .update({ name, organization, equipmentId, isLeader, startPressure })
        .where({ id }),
    "v1.SquadMemberRemoved": ({ id, removedAt }) =>
      squadMembersTable.update({ removedAt }).where({ id }),
    "v1.SquadMemberStartPressureUpdated": ({ id, startPressure }) =>
      squadMembersTable.update({ startPressure }).where({ id }),
    "v1.SquadMemberEndPressureUpdated": ({ id, endPressure }) =>
      squadMembersTable.update({ endPressure }).where({ id }),
  }
);
