import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentTime } from "@/context/current-time";
import { events } from "@/livestore/schema";
import type { Squad } from "@/livestore/schema/operation/squad";
import { useStore } from "@livestore/react";
import {
  ArchiveIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  TextCursorInputIcon,
} from "lucide-react";

export const SquadOptionsMenu = ({
  squad,
  setEditSquadName,
}: {
  squad: Squad;
  setEditSquadName: (editSquadName: boolean) => void;
}) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();

  const handleArchiveSquad = () => {
    store.commit(
      events.squadArchived({ id: squad.id, archivedAt: currentTime })
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <EllipsisVerticalIcon className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem disabled>
          <EyeIcon className="size-3.5" />
          <span>Detailansicht öffnen</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditSquadName(true)}>
          <TextCursorInputIcon className="size-3.5" />
          <span>Trupp umbenennen</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={squad.status !== "standby"}
          onClick={handleArchiveSquad}
        >
          <ArchiveIcon className="size-3.5" />
          <span>Trupp archivieren</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
