import LiveStoreWorker from "@/livestore/livestore.worker.ts?worker";
import { schema } from "@/livestore/schema/index.ts";
import { makePersistedAdapter } from "@livestore/adapter-web";
import LiveStoreSharedWorker from "@livestore/adapter-web/shared-worker?sharedworker";
import { LiveStoreProvider } from "@livestore/react";
import { unstable_batchedUpdates as batchUpdates } from "react-dom";
import { StoreError } from "./error";
import { Loading } from "./loading";

type Props = {
  children: React.ReactNode;
  orgId: string;
  syncToken: string;
};

export const Livestore = ({ children, orgId, syncToken }: Props) => {
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
      key={orgId}
      schema={schema}
      adapter={adapter}
      renderLoading={(_) => <Loading stage={_.stage} />}
      renderError={(_) => <StoreError error={String(_)} />}
      batchUpdates={batchUpdates}
      storeId={orgId}
      syncPayload={{ authToken: syncToken }}
    >
      {children}
    </LiveStoreProvider>
  );
};
