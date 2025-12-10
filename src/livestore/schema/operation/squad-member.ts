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
  }
);
