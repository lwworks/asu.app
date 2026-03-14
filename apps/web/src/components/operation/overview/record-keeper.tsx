import { Input } from "@/components/ui/input";
import { events } from "@/livestore/schema";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { useState } from "react";

export const RecordKeeper = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const [value, setValue] = useState(operation.recordKeeper ?? "");

  const handleBlur = () => {
    if (value !== (operation.recordKeeper ?? "")) {
      store.commit(
        events.recordKeeperUpdated({
          id: operation.id,
          recordKeeper: value,
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
