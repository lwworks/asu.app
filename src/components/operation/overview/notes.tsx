import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentTime } from "@/context/current-time";
import { getDownloadUrl, noteAttachmentKey, uploadFile } from "@/lib/s3";
import { operationNotes$ } from "@/livestore/queries/operation/notes";
import { events } from "@/livestore/schema";
import type { OperationNote } from "@/livestore/schema/operation/note";
import { useStore } from "@livestore/react";
import { format } from "date-fns";
import { ArrowUpIcon, FileIcon, PaperclipIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

export const OperationNotes = ({ operationId }: { operationId: string }) => {
  const { currentTime } = useCurrentTime();
  const { store } = useStore();
  const notes = store.useQuery(
    operationNotes$(operationId)
  ) as OperationNote[];
  const listRef = useRef<HTMLUListElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const text = formData.get("text") as string;
    if (!text && !selectedFile) return;

    const noteId = crypto.randomUUID();
    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    if (selectedFile) {
      setUploading(true);
      try {
        const key = noteAttachmentKey(operationId, noteId, selectedFile.name);
        attachmentUrl = await uploadFile(selectedFile, key);
        attachmentName = selectedFile.name;
      } catch (err) {
        console.error("File upload failed:", err);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    store.commit(
      events.operationNoteCreated({
        id: noteId,
        operationId,
        text: text || attachmentName || "",
        timestamp: currentTime,
        attachmentUrl,
        attachmentName,
      })
    );
    form.reset();
    setSelectedFile(null);
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
    <Card className="p-0 flex flex-col flex-1 min-h-0 gap-0">
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
                <div className="grow text-muted-foreground">
                  {note.text}
                  {note.attachmentUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const url = await getDownloadUrl(note.attachmentUrl!);
                          window.open(url, "_blank", "noopener,noreferrer");
                        } catch (err) {
                          console.error("Failed to get download URL:", err);
                        }
                      }}
                      className="inline-flex items-center gap-1 ml-1 text-foreground hover:underline cursor-pointer"
                    >
                      <PaperclipIcon className="size-3 text-primary" />
                      <span>{note.attachmentName ?? "Anhang"}</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
        </ul>
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-card to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-card to-transparent" />
      </div>
      {selectedFile && (
        <div className="px-6 flex items-center gap-2 text-sm text-muted-foreground">
          <FileIcon className="size-3.5 shrink-0" />
          <span className="truncate">{selectedFile.name}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      )}
      <form
        className="flex gap-2 p-6 pt-3 relative z-10 flex-none"
        onSubmit={handleSubmit}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setSelectedFile(file);
          }}
        />
        <Input
          name="text"
          type="text"
          placeholder="Notiz hinzufügen..."
          autoComplete="off"
          className="grow"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <PaperclipIcon className="size-4" />
        </Button>
        <Button
          type="submit"
          size="icon"
          variant="secondary"
          disabled={uploading}
        >
          <ArrowUpIcon className="size-4" />
        </Button>
      </form>
    </Card>
  );
};
