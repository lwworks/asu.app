import type { Operation } from "@/livestore/schema/operation";
import { format } from "date-fns";
import { SquareIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export const EndOperationDialog = ({ operation }: { operation: Operation }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive border-destructive dark:border-destructive"
        >
          <SquareIcon className="size-3.5" />
          <span>Einsatz beenden</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="bg-white/4 p-6 border-b">
          <DialogTitle>Einsatz beenden</DialogTitle>
          <div className="text-sm text-muted-foreground">
            <span>{operation.description}</span>
            <span> vom </span>
            {format(operation.createdAt, "dd.MM.yyyy")}
            <span> am </span>
            <span>{format(operation.createdAt, "HH:mm")}</span>
            <span> Uhr</span>
          </div>
        </DialogHeader>
        <div className="h-64"></div>
      </DialogContent>
    </Dialog>
  );
};
