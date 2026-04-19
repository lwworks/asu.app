import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrgLogo } from "@/components/org/logo";
import { useOrg } from "@/context/org";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

export const OrgSwitcher = () => {
  const { orgs, currentOrg, switchOrg } = useOrg();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!currentOrg) return null;

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrg.orgId) return;
    await switchOrg(orgId);
    if (pathname.startsWith("/einsatz/")) {
      navigate({ to: "/" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 hover:text-foreground transition-colors outline-hidden cursor-pointer">
        <OrgLogo name={currentOrg.name} logoUrl={currentOrg.logoUrl} size="sm" />
        {currentOrg.name}
        <ChevronsUpDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.orgId}
            onClick={() => handleSwitch(org.orgId)}
            className="gap-2"
          >
            <OrgLogo name={org.name} logoUrl={org.logoUrl} size="sm" />
            <span>{org.name}</span>
            {org.orgId === currentOrg.orgId && (
              <CheckIcon className="ml-auto size-4" />
            )}
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
