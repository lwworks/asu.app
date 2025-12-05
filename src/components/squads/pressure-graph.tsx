import { cn } from "../../lib/cn";

export const PressureGraph = ({
  initialPressures,
}: {
  initialPressures: Pressure[];
}) => {
  const minPressure = Math.min(
    ...initialPressures.map((pressure) => pressure.value)
  );

  return (
    <div className="relative w-full h-2 bg-gray-800">
      <div
        className={cn(
          "h-full bg-emerald-300",
          minPressure < 200 && "bg-amber-300",
          minPressure < 100 && "bg-rose-300"
        )}
        style={{ width: `${(minPressure / 300) * 100}%` }}
      />
    </div>
  );
};
