import { operationSquads$ } from "@/livestore/queries/operation/squads";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { Link } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";

export const OperationCard = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const squads = store.useQuery(operationSquads$(operation.id));

  const activeSquads = squads.filter(
    (squad) => squad.status === "active"
  ).length;
  const pausedSquads = 0;
  const standbySquads = squads.filter(
    (squad) => squad.status === "standby"
  ).length;
  const endedSquads = squads.filter((squad) => squad.status === "ended").length;

  return (
    <li
      key={operation.id}
      className="relative p-6 border-b last:border-b-0 hover:bg-white/4"
    >
      <Link
        to={`/einsatz/$operationSlug`}
        params={{ operationSlug: operation.slug }}
      >
        <span className="absolute inset-0" />
        <h3 className="text-base font-medium">{operation.description}</h3>
      </Link>
      <div className="flex items-center gap-1 mt-2">
        <UsersIcon className="size-3.5 text-muted-foreground/75" />
        <div className="text-sm text-muted-foreground">
          <span>
            {squads.length} Trupp{squads.length !== 1 ? "s" : ""}
          </span>
          {squads.length > 0 && <span>: </span>}
          {activeSquads > 0 && (
            <span className="text-emerald-300">{activeSquads} aktiv</span>
          )}
          {pausedSquads > 0 && (
            <>
              {activeSquads > 0 && <span>, </span>}
              <span className="text-amber-200">{pausedSquads} pausiert</span>
            </>
          )}
          {standbySquads > 0 && (
            <>
              {activeSquads + pausedSquads > 0 && <span>, </span>}
              <span>{standbySquads} in Bereitstellung</span>
            </>
          )}
          {endedSquads > 0 && (
            <>
              {activeSquads + pausedSquads + standbySquads > 0 && (
                <span>, </span>
              )}
              <span>{endedSquads} beendet</span>
            </>
          )}
        </div>
      </div>
    </li>
  );
};
