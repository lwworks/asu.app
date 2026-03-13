import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/lib/s3";
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
import { FileDownIcon, PaperclipIcon } from "lucide-react";
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
      attachmentUrl: note.attachmentUrl,
      attachmentName: note.attachmentName,
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
      <div className="text-sm uppercase text-muted-foreground tracking-wider flex-none">
        Einsatzverlauf
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
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-x-0 top-0 h-6 bg-linear-to-b from-background to-transparent z-10" />
        <div ref={listRef} className="h-full overflow-y-auto">
          <div className="relative border-l border-muted-foreground/20 ml-0.5 pl-4 space-y-4 py-6">
            {allEntries.map((entry) => (
              <div key={entry.id} className="relative text-sm leading-tight">
                <div className="absolute -left-4.5 top-2 size-1 rounded-full bg-foreground" />
                <div className="text-muted-foreground/50 text-xs">
                  {format(entry.timestamp, "HH:mm:ss")}
                  <span className="ml-2">{entry.source}</span>
                </div>
                <div className="text-muted-foreground">
                  {entry.text}
                  {entry.attachmentName && entry.attachmentUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const url = await getDownloadUrl(entry.attachmentUrl!);
                          window.open(url, "_blank", "noopener,noreferrer");
                        } catch (err) {
                          console.error("Failed to get download URL:", err);
                        }
                      }}
                      className="inline-flex items-center gap-1 ml-1 text-primary hover:underline cursor-pointer"
                    >
                      <PaperclipIcon className="size-3" />
                      <span>1 Datei</span>
                    </button>
                  )}
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
        <div className="absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-background to-transparent z-10" />
      </div>
      <div className="flex-none">
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
