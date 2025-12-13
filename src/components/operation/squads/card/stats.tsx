import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/cn";
import { duration } from "@/lib/duration";
import { latestLogWithPressure$ } from "@/livestore/queries/operation/latest-log-with-pressure";
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
  defaultBarsPerMinute: number
) => {
  if (!startTime || !startPressure) return 0;
  let duration = differenceInSeconds(currentTime, startTime) / 60;
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
    duration =
      differenceInSeconds(logWithLowestPressure.timestamp, startTime) / 60;
    barsPerMinute = (startPressure - latestPressure) / duration;
    duration =
      differenceInSeconds(currentTime, logWithLowestPressure.timestamp) / 60;
  }
  return Math.max(
    Math.ceil((latestPressure - duration * barsPerMinute) / 5) * 5,
    0
  );
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
  const latestLogWithPressure = store.useQuery(
    latestLogWithPressure$(squad.id)
  ) as SquadLog | null;

  const defaultBarsPerMinute = 10;
  const defaultStartPressure = 300;
  const criticalPressure = 60;
  const pressureUpdateInterval = 10;

  const startPressure =
    members
      .filter((member) => member.startPressure !== null)
      .sort((a, b) => a.startPressure! - b.startPressure!)[0]?.startPressure ??
    defaultStartPressure;

  const pressure = predictedPressure(
    startPressure,
    squad.startedAt,
    currentTime,
    logs,
    defaultBarsPerMinute
  );

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
            {squad.startedAt ? duration(squad.startedAt, currentTime) : "00:00"}
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
          "relative w-full h-2 border-y",
          pressure <= criticalPressure
            ? "bg-destructive/20 border-destructive/20"
            : "bg-primary/20"
        )}
      >
        <div
          className={cn(
            "h-full bg-primary",
            pressure <= criticalPressure && "bg-destructive"
          )}
          style={{ width: `${(pressure / 300) * 100}%` }}
        />
        <div className="absolute inset-y-0 left-1/6 w-px -translate-x-px bg-zinc-800" />
        <div className="absolute inset-y-0 left-1/3 w-px -translate-x-px bg-zinc-800" />
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-px bg-zinc-800" />
        <div className="absolute inset-y-0 left-2/3 w-px -translate-x-px bg-zinc-800" />
        <div className="absolute inset-y-0 left-5/6 w-px -translate-x-px bg-zinc-800" />
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
