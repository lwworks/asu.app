import { makeSchema, State } from "@livestore/livestore";
import { forcesEvents, forcesMaterializers, forcesTable } from "./force";
import {
  operationsEvents,
  operationsMaterializers,
  operationsTable,
} from "./operation";
import {
  operationNotesEvents,
  operationNotesMaterializers,
  operationNotesTable,
} from "./operation/note";
import {
  squadsEvents,
  squadsMaterializers,
  squadsTable,
} from "./operation/squad";
import {
  squadLogsEvents,
  squadLogsMaterializers,
  squadLogsTable,
} from "./operation/squad-log";
import {
  squadMembersEvents,
  squadMembersMaterializers,
  squadMembersTable,
} from "./operation/squad-member";
import { uiSettingsEvents, uiSettingsTable } from "./ui-settings";

export const tables = {
  uiSettings: uiSettingsTable,
  operations: operationsTable,
  operationNotes: operationNotesTable,
  squads: squadsTable,
  squadLogs: squadLogsTable,
  squadMembers: squadMembersTable,
  forces: forcesTable,
};

export const events = {
  ...uiSettingsEvents,
  ...operationsEvents,
  ...operationNotesEvents,
  ...squadsEvents,
  ...squadLogsEvents,
  ...squadMembersEvents,
  ...forcesEvents,
};

const materializers = {
  ...operationsMaterializers,
  ...operationNotesMaterializers,
  ...squadsMaterializers,
  ...squadLogsMaterializers,
  ...squadMembersMaterializers,
  ...forcesMaterializers,
};

const state = State.SQLite.makeState({ tables, materializers });

export const schema = makeSchema({ events, state });
