import { makeSchema, State } from "@livestore/livestore";
import {
  operationsEvents,
  operationsMaterializers,
  operationsTable,
} from "./operation";
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
  squads: squadsTable,
  squadLogs: squadLogsTable,
  squadMembers: squadMembersTable,
};

export const events = {
  ...uiSettingsEvents,
  ...operationsEvents,
  ...squadsEvents,
  ...squadLogsEvents,
  ...squadMembersEvents,
};

const materializers = {
  ...operationsMaterializers,
  ...squadsMaterializers,
  ...squadLogsMaterializers,
  ...squadMembersMaterializers,
};

const state = State.SQLite.makeState({ tables, materializers });

export const schema = makeSchema({ events, state });
