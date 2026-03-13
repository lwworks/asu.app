import { Button } from "@/components/ui/button";
import { operationNotes$ } from "@/livestore/queries/operation/notes";
import { squadLogs$ } from "@/livestore/queries/operation/squad-logs";
import { operationSquads$ } from "@/livestore/queries/operation/squads";
import type { Operation } from "@/livestore/schema/operation";
import type { OperationNote } from "@/livestore/schema/operation/note";
import type { Squad } from "@/livestore/schema/operation/squad";
import type { SquadLog } from "@/livestore/schema/operation/squad-log";
import { useStore } from "@livestore/react";
import { pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import { FileDownIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EventLogDocument, type EventEntry } from "./event-log-pdf";

const SquadLogCollector = ({
  squad,
  onEntries,
}: {
  squad: Squad;
  onEntries: (key: string, entries: EventEntry[]) => void;
}) => {
  const { store } = useStore();
  const logs = store.useQuery(squadLogs$(squad.id)) as SquadLog[];

  useEffect(() => {
    const creationEntry: EventEntry = {
      id: `squad-created-${squad.id}`,
      timestamp: squad.createdAt,
      source: squad.name,
      text: "Trupp erstellt",
      pressure: null,
    };

    const logEntries: EventEntry[] = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      source: squad.name,
      text: log.text ?? "",
      pressure: log.pressure,
    }));

    onEntries(`squad-${squad.id}`, [creationEntry, ...logEntries]);
  }, [logs, squad.id, squad.name, squad.createdAt, onEntries]);

  return null;
};

const NotesCollector = ({
  operationId,
  onEntries,
}: {
  operationId: string;
  onEntries: (key: string, entries: EventEntry[]) => void;
}) => {
  const { store } = useStore();
  const notes = store.useQuery(
    operationNotes$(operationId)
  ) as OperationNote[];

  useEffect(() => {
    const entries: EventEntry[] = notes.map((note) => ({
      id: note.id,
      timestamp: note.timestamp,
      source: "Notiz",
      text: note.text,
      pressure: null,
    }));
    onEntries("notes", entries);
  }, [notes, operationId, onEntries]);

  return null;
};

export const OperationEventLog = ({
  operation,
}: {
  operation: Operation;
}) => {
  const { store } = useStore();
  const squads = store.useQuery(operationSquads$(operation.id)) as Squad[];
  const [entryGroups, setEntryGroups] = useState<Map<string, EventEntry[]>>(
    new Map()
  );
  const listRef = useRef<HTMLDivElement>(null);

  const handleEntries = useCallback(
    (key: string, entries: EventEntry[]) => {
      setEntryGroups((prev) => {
        const next = new Map(prev);
        next.set(key, entries);
        return next;
      });
    },
    []
  );

  const operationStartEntry: EventEntry = {
    id: `operation-created-${operation.id}`,
    timestamp: operation.createdAt,
    source: "Einsatz",
    text: "Einsatz angelegt",
    pressure: null,
  };

  const allEntries: EventEntry[] = [operationStartEntry];
  for (const entries of entryGroups.values()) {
    allEntries.push(...entries);
  }
  allEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  useEffect(() => {
    setTimeout(
      () =>
        listRef.current?.scrollTo({
          top: listRef.current?.scrollHeight ?? 9999,
          behavior: "smooth",
        }),
      100
    );
  }, [allEntries.length]);

  const handleExportPdf = async () => {
    const blob = await pdf(
      <EventLogDocument operation={operation} entries={allEntries} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `einsatz-log-${operation.slug}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs uppercase text-muted-foreground/50 font-medium tracking-wider pb-3 flex-none">
        Einsatz-Log
      </div>
      {squads.map((squad) => (
        <SquadLogCollector
          key={squad.id}
          squad={squad}
          onEntries={handleEntries}
        />
      ))}
      <NotesCollector
        operationId={operation.id}
        onEntries={handleEntries}
      />
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="relative border-l border-muted-foreground/20 ml-[52px] pl-5 space-y-4 py-1">
          {allEntries.map((entry) => (
            <div key={entry.id} className="relative text-sm leading-tight">
              <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-muted-foreground/30 -translate-x-[calc(50%-0.5px)]" />
              <div className="text-muted-foreground/50 text-xs">
                {format(entry.timestamp, "HH:mm:ss")}
                <span className="ml-2">{entry.source}</span>
              </div>
              <div className="text-muted-foreground">
                {entry.text}
                {entry.pressure !== null && (
                  <span className="text-muted-foreground/50 ml-2">
                    {entry.pressure} bar
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-4 flex-none">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleExportPdf}
        >
          <FileDownIcon className="size-3.5" />
          <span>Als PDF exportieren</span>
        </Button>
      </div>
    </div>
  );
};
