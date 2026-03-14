import { PlusIcon } from "lucide-react";

export const NewMemberButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      className="w-full px-6 py-3 flex items-center justify-between text-sm cursor-pointer hover:bg-accent dark:hover:bg-white/4 text-muted-foreground hover:text-foreground border-b flex-none"
      onClick={onClick}
    >
      <span>Truppmitglied hinzufügen</span>
      <PlusIcon className="size-4" />
    </button>
  );
};
