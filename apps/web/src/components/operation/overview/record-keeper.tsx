import { Input } from "@/components/ui/input";
import { useCurrentTime } from "@/context/current-time";
import { events } from "@/livestore/schema";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { useState } from "react";

export const RecordKeeper = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const { currentTime } = useCurrentTime();
  const [value, setValue] = useState(operation.recordKeeper ?? "");

  const handleBlur = () => {
    if (value !== (operation.recordKeeper ?? "")) {
      store.commit(
        events.recordKeeperUpdated({
          id: operation.id,
          recordKeeper: value,
        })
      );
      store.commit(
        events.operationNoteCreated({
          id: crypto.randomUUID(),
          operationId: operation.id,
          text: value
            ? `Überwachender geändert: ${value}`
            : "Überwachender entfernt",
          timestamp: currentTime,
          kind: "record-keeper",
        })
      );
    }
  };

  return (
    <div>
      <div className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
        Überwachender
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="Name eingeben..."
      />
    </div>
  );
};
