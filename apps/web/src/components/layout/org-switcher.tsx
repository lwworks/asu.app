import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrg } from "@/context/org";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

export const OrgSwitcher = () => {
  const { orgs, currentOrg, switchOrg } = useOrg();

  if (!currentOrg) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors outline-hidden cursor-pointer">
        {currentOrg.name}
        {orgs.length > 1 && <ChevronsUpDownIcon className="size-3.5" />}
      </DropdownMenuTrigger>
      {orgs.length > 1 && (
        <DropdownMenuContent align="start">
          {orgs.map((org) => (
            <DropdownMenuItem key={org.orgId} onClick={() => switchOrg(org.orgId)}>
              {org.name}
              {org.orgId === currentOrg.orgId && <CheckIcon className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
};
