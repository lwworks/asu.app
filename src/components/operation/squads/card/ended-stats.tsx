import { duration } from "@/lib/duration";
import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";

export const EndedStats = ({
  squad,
  members,
}: {
  squad: Squad;
  members: SquadMember[];
}) => {
  const activeDuration =
    squad.startedAt && squad.endedAt
      ? duration(squad.startedAt, squad.endedAt)
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
