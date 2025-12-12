import LiveStoreWorker from "@/livestore/livestore.worker.ts?worker";
import { schema } from "@/livestore/schema/index.ts";
import { makePersistedAdapter } from "@livestore/adapter-web";
import LiveStoreSharedWorker from "@livestore/adapter-web/shared-worker?sharedworker";
import { LiveStoreProvider } from "@livestore/react";
import { unstable_batchedUpdates as batchUpdates } from "react-dom";
import { Loading } from "./loading";

export const Livestore = ({ children }: { children: React.ReactNode }) => {
  const resetPersistence =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("reset") !== null;

  if (resetPersistence) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("reset");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${searchParams.toString()}`
    );
  }

  const adapter = makePersistedAdapter({
    storage: { type: "opfs" },
    worker: LiveStoreWorker,
    sharedWorker: LiveStoreSharedWorker,
    resetPersistence,
  });

  return (
    <LiveStoreProvider
      schema={schema}
      adapter={adapter}
      renderLoading={(_) => <Loading stage={_.stage} />}
      batchUpdates={batchUpdates}
      storeId="asu-app-dev-4"
    >
      {children}
    </LiveStoreProvider>
  );
};
