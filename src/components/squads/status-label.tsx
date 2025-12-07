import { cn } from "../../lib/cn";

export const StatusLabel = ({
  status,
}: {
  status: { id: string; label: string };
}) => {
  return (
    <div
      className={cn(
        "h-6 rounded-full w-fit px-3 flex items-center font-medium text-base",
        status.id === "active" && "bg-amber-300 text-amber-950",
        status.id === "standby" && "bg-emerald-300 text-emerald-950",
        status.id === "ended" && "bg-zinc-300 text-zinc-950"
      )}
    >
      {status.label}
    </div>
  );
};
