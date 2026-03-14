import { makeWorker } from "@livestore/adapter-web/worker";
import { makeCfSync } from "@livestore/sync-cf";
import { schema } from "./schema/index.ts";

makeWorker({
  schema,
  sync: { backend: makeCfSync({ url: import.meta.env.VITE_SYNC_URL }) },
});
