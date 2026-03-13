import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentTime } from "@/context/current-time";
import { operationNotes$ } from "@/livestore/queries/operation/notes";
import { events } from "@/livestore/schema";
import type { OperationNote } from "@/livestore/schema/operation/note";
import { useStore } from "@livestore/react";
import { format } from "date-fns";
import { ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";

export const OperationNotes = ({ operationId }: { operationId: string }) => {
  const { currentTime } = useCurrentTime();
  const { store } = useStore();
  const notes = store.useQuery(
    operationNotes$(operationId)
  ) as OperationNote[];
  const listRef = useRef<HTMLUListElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const text = formData.get("text") as string;
    if (!text) return;

    store.commit(
      events.operationNoteCreated({
        id: crypto.randomUUID(),
        operationId,
        text,
        timestamp: currentTime,
      })
    );
    (event.target as HTMLFormElement).reset();
  };

  useEffect(() => {
    setTimeout(
      () =>
        listRef.current?.scrollTo({
          top: listRef.current?.scrollHeight ?? 9999,
          behavior: "smooth",
        }),
      100
    );
  }, [notes.length]);

  return (
    <Card className="p-0 flex flex-col flex-1 min-h-0">
      <div className="px-6 pt-6 flex text-xs uppercase text-muted-foreground/50 font-medium tracking-wider border-b pb-3 flex-none">
        <div className="w-17 shrink-0">Zeit</div>
        <div className="grow">Notiz</div>
      </div>
      <div className="relative flex-1 min-h-0">
        <ul
          ref={listRef}
          className="px-6 py-3 space-y-2 h-full overflow-y-auto"
        >
          {[...notes]
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .map((note) => (
              <li key={note.id} className="flex text-sm leading-tight">
                <div className="w-17 shrink-0 text-muted-foreground/50">
                  {format(note.timestamp, "HH:mm:ss")}
                </div>
                <div className="grow text-muted-foreground">{note.text}</div>
              </li>
            ))}
        </ul>
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-card to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-card to-transparent" />
      </div>
      <form
        className="flex gap-2 p-6 pt-0 relative z-10 flex-none"
        onSubmit={handleSubmit}
      >
        <Input
          name="text"
          type="text"
          placeholder="Notiz hinzufügen..."
          autoComplete="off"
          className="grow"
        />
        <Button type="submit" size="icon" variant="secondary">
          <ArrowUpIcon className="size-4" />
        </Button>
      </form>
    </Card>
  );
};
