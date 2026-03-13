import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { differenceInSeconds } from "date-fns";

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? `${hours.toString().padStart(2, "0")}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const EndedStats = ({
  squad,
  members,
}: {
  squad: Squad;
  members: SquadMember[];
}) => {
  const activeDuration =
    squad.startedAt && squad.endedAt
      ? formatDuration(
          Math.max(
            differenceInSeconds(squad.endedAt, squad.startedAt) -
              Math.floor((squad.totalPausedMs ?? 0) / 1000),
            0
          )
        )
      : null;

  const highestStartPressure = Math.max(
    ...members
      .filter((m) => m.startPressure !== null)
      .map((m) => m.startPressure!)
  );

  const membersWithEndPressure = members.filter(
    (m) => m.endPressure !== null
  );
  const lowestEndPressure =
    membersWithEndPressure.length > 0
      ? Math.min(...membersWithEndPressure.map((m) => m.endPressure!))
      : null;

  const pressureUsed =
    lowestEndPressure !== null && Number.isFinite(highestStartPressure)
      ? highestStartPressure - lowestEndPressure
      : null;

  return (
    <div className="grid grid-cols-2 divide-x border-y mt-5">
      <div className="p-6">
        <div className="text-3xl font-mono text-white">
          {activeDuration ?? "—"}
        </div>
        <div className="text-sm uppercase tracking-wider text-muted-foreground">
          Einsatzdauer
        </div>
      </div>
      <div className="p-6">
        <div className="text-3xl font-mono text-white">
          {pressureUsed !== null ? pressureUsed : "—"}
        </div>
        <div className="text-sm uppercase tracking-wider text-muted-foreground">
          Druckverbrauch
        </div>
      </div>
    </div>
  );
};
