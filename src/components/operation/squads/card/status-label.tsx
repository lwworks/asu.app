import { cn } from "@/lib/cn";

const statusLabels = {
  active: "Im Einsatz",
  standby: "In Bereitstellung",
  paused: "Pausiert",
  ended: "Beendet",
};

export const StatusLabel = ({ status }: { status: string }) => {
  return (
    <div
      className={cn(
        "h-5 rounded-full w-fit px-2 flex items-center font-normal text-sm",
        status === "active" && "bg-primary text-primary-foreground",
        status === "standby" && "bg-secondary text-secondary-foreground",
        status === "ended" && "bg-secondary text-secondary-foreground"
      )}
    >
      {statusLabels[status as keyof typeof statusLabels]}
    </div>
  );
};
