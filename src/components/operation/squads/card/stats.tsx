import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/cn";
import { logsWithPressure$ } from "@/livestore/queries/operation/logs-with-pressure";
import { squadLogs$ } from "@/livestore/queries/operation/squad-logs";
import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadLog } from "@/livestore/schema/operation/squad-log";
import type { SquadMember } from "@/livestore/schema/operation/squad-member";
import { useStore } from "@livestore/react";
import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { AlertTriangleIcon } from "lucide-react";

const predictedPressure = (
  startPressure: number,
  startTime: Date | null,
  currentTime: Date,
  logs: SquadLog[],
  defaultBarsPerMinute: number,
  totalPausedMs: number
) => {
  if (!startTime || !startPressure) return 0;
  const pausedMinutes = totalPausedMs / 60000;
  let duration = differenceInSeconds(currentTime, startTime) / 60 - pausedMinutes;
  let barsPerMinute = defaultBarsPerMinute;
  let latestPressure = startPressure;

  const logsWithLowerPressures = logs.filter(
    (log) => log.pressure !== null && log.pressure < startPressure
  );
  if (logsWithLowerPressures.length > 0) {
    const logWithLowestPressure = logsWithLowerPressures.sort(
      (a, b) => a.pressure! - b.pressure!
    )[0];
    latestPressure = logWithLowestPressure.pressure!;
    const durationToLog =
      differenceInSeconds(logWithLowestPressure.timestamp, startTime) / 60 - pausedMinutes;
    barsPerMinute = durationToLog > 0 ? (startPressure - latestPressure) / durationToLog : defaultBarsPerMinute;
    duration =
      differenceInSeconds(currentTime, logWithLowestPressure.timestamp) / 60;
  }
  return Math.max(
    Math.ceil((latestPressure - duration * barsPerMinute) / 5) * 5,
    0
  );
};

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? `${hours.toString().padStart(2, "0")}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const SquadStats = ({
  squad,
  members,
}: {
  squad: Squad;
  members: SquadMember[];
}) => {
  const { currentTime } = useCurrentTime();
  const { store } = useStore();
  const logs = store.useQuery(squadLogs$(squad.id)) as SquadLog[];
  const logsWithPressure = store.useQuery(
    logsWithPressure$(squad.id)
  ) as SquadLog[];
  const latestLogWithPressure =
    logsWithPressure.length > 0 ? logsWithPressure[0] : null;

  const defaultBarsPerMinute = 10;
  const defaultStartPressure = 300;
  const criticalPressure = 60;
  const pressureUpdateInterval = 10;

  const totalPausedMs = squad.totalPausedMs ?? 0;
  const isPaused = squad.status === "paused";
  const effectiveCurrentTime = isPaused && squad.pausedAt ? squad.pausedAt : currentTime;

  const startPressure =
    members
      .filter((member) => member.startPressure !== null)
      .sort((a, b) => a.startPressure! - b.startPressure!)[0]?.startPressure ??
    defaultStartPressure;

  const pressure = predictedPressure(
    startPressure,
    squad.startedAt,
    effectiveCurrentTime,
    logs,
    defaultBarsPerMinute,
    totalPausedMs
  );

  const activeDurationSeconds = squad.startedAt
    ? Math.max(
        differenceInSeconds(effectiveCurrentTime, squad.startedAt) -
          Math.floor(totalPausedMs / 1000),
        0
      )
    : 0;

  return (
    <div>
      <div className="grid grid-cols-2 divide-x">
        <div className="p-6">
          <div
            className={cn(
              "text-3xl font-mono",
              squad.startedAt && "text-white"
            )}
          >
            {squad.startedAt ? formatDuration(activeDurationSeconds) : "00:00"}
          </div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">
            im Einsatz
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "text-3xl font-mono text-primary",
                pressure <= criticalPressure && "text-destructive"
              )}
            >
              {pressure}
            </div>
            {pressure <= criticalPressure ? (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangleIcon className="size-6 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rückzug antreten!</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                {latestLogWithPressure &&
                  differenceInMinutes(
                    currentTime,
                    latestLogWithPressure.timestamp
                  ) >= pressureUpdateInterval && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangleIcon className="size-6 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Druckabfrage erforderlich.</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
              </>
            )}
          </div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">
            Restdruck
          </div>
        </div>
      </div>
      <div
        className={cn(
          "relative w-full h-2.5 border-y",
          pressure <= criticalPressure
            ? "bg-stripes-destructive"
            : "bg-zinc-800"
        )}
      >
        <div
          className={cn(
            "h-full bg-primary",
            pressure <= criticalPressure && "bg-destructive"
          )}
          style={{ width: `${(pressure / 300) * 100}%` }}
        />
        {pressure >= 50 && (
          <div className="absolute inset-y-0 left-1/6 w-px -translate-x-px bg-zinc-800" />
        )}
        {pressure >= 100 && (
          <div className="absolute inset-y-0 left-1/3 w-px -translate-x-px bg-zinc-800" />
        )}
        {pressure >= 150 && (
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-px bg-zinc-800" />
        )}
        {pressure >= 200 && (
          <div className="absolute inset-y-0 left-2/3 w-px -translate-x-px bg-zinc-800" />
        )}
        {pressure >= 250 && (
          <div className="absolute inset-y-0 left-5/6 w-px -translate-x-px bg-zinc-800" />
        )}
      </div>
      <div className="flex text-xs uppercase text-muted-foreground/50 font-medium tracking-wider text-center px-8 pt-1">
        <div className="w-1/5 shrink-0">50</div>
        <div className="w-1/5 shrink-0">100</div>
        <div className="w-1/5 shrink-0">150</div>
        <div className="w-1/5 shrink-0">200</div>
        <div className="w-1/5 shrink-0">250</div>
      </div>
    </div>
  );
};
