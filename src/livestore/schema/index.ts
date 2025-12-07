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

export const tables = {
  operations: operationsTable,
  squads: squadsTable,
};

export const events = {
  ...operationsEvents,
  ...squadsEvents,
};

const materializers = {
  ...operationsMaterializers,
  ...squadsMaterializers,
};

const state = State.SQLite.makeState({ tables, materializers });

export const schema = makeSchema({ events, state });
