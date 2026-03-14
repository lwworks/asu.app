import { IconLoading } from "@/components/visuals/icon-loading";
import { Button } from "@/components/ui/button";

export const StoreError = ({ error }: { error: string }) => {
  const handleReset = async () => {
    try {
      const root = await navigator.storage.getDirectory();
      for await (const name of (root as any).keys()) {
        if (name.startsWith("livestore-")) {
          await root.removeEntry(name, { recursive: true });
        }
      }
    } catch {
      // If OPFS cleanup fails, reload anyway
    }
    window.location.reload();
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center pb-16 gap-8">
      <IconLoading className="h-12 text-destructive" />
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <p className="text-foreground">
          Die Datenbank konnte nicht geladen werden.
        </p>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
          {error}
        </pre>
        <Button onClick={handleReset}>Datenbank zurücksetzen</Button>
      </div>
    </div>
  );
};
