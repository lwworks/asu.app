import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrg } from "@/context/org";
import { Link } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

export const OrgSwitcher = () => {
  const { orgs, currentOrg, switchOrg } = useOrg();

  if (!currentOrg) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors outline-hidden cursor-pointer">
        {currentOrg.name}
        <ChevronsUpDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {orgs.map((org) => (
          <DropdownMenuItem key={org.orgId} onClick={() => switchOrg(org.orgId)}>
            {org.name}
            {org.orgId === currentOrg.orgId && <CheckIcon className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/neue-organisation">
            <PlusIcon className="size-4" />
            Neue Organisation
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
