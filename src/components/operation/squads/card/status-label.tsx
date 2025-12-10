import { cn } from "@/lib/cn";

const statusLabels = {
  active: "Im Einsatz",
  standby: "In Bereitschaft",
  ended: "Beendet",
};

export const StatusLabel = ({ status }: { status: string }) => {
  return (
    <div
      className={cn(
        "h-5 rounded-full w-fit px-2 flex items-center font-medium text-sm",
        status === "active" && "bg-emerald-300 text-emerald-950",
        status === "standby" && "bg-zinc-300 text-zinc-950",
        status === "ended" && "bg-zinc-300 text-zinc-950"
      )}
    >
      {statusLabels[status as keyof typeof statusLabels]}
    </div>
  );
};
