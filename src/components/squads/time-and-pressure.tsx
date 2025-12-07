import { useCurrentTime } from "../../context/current-time";
import { cn } from "../../lib/cn";
import { duration } from "../../lib/duration";

export const TimeAndPressure = ({
  startTime,
  initialPressures,
}: {
  startTime: Date | null;
  initialPressures: Pressure[];
}) => {
  const { currentTime } = useCurrentTime();
  const pressure = Math.min(
    ...initialPressures.map((pressure) => pressure.value)
  );

  return (
    <div className="relative border-b border-zinc-800 grid grid-cols-2 divide-x divide-zinc-800 text-zinc-500">
      <div className="p-4">
        <div className={cn("text-3xl font-mono", startTime && "text-white")}>
          {startTime ? duration(startTime, currentTime) : "00:00"}
        </div>
        <div className="text-sm uppercase tracking-wider">im Einsatz</div>
      </div>
      <div className="p-4">
        <div
          className={cn(
            "text-3xl font-mono text-emerald-300",
            pressure < 200 && "text-amber-300",
            pressure < 100 && "text-rose-300"
          )}
        >
          {pressure}
        </div>
        <div className="text-sm uppercase tracking-wider">Restdruck</div>
      </div>
    </div>
  );
};
