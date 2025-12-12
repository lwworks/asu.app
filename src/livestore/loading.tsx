import { IconLoading } from "@/components/visuals/icon-loading";

export const Loading = ({
  stage,
}: {
  stage: "loading" | "migrating" | "done" | "rehydrating" | "syncing";
}) => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center pb-16 gap-8">
      <IconLoading className="h-12 text-[#F2FF00]" />
      <p className="text-foreground">
        {stage === "loading" && "Laden..."}
        {stage === "migrating" && "Migrieren..."}
        {stage === "done" && "Fertig!"}
        {stage === "rehydrating" && "Re-Hydrieren..."}
        {stage === "syncing" && "Synchronisieren..."}
      </p>
    </div>
  );
};
