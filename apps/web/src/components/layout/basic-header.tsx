import { Button } from "@/components/ui/button";
import { Logo } from "@/components/visuals/logo";
import { useAuth } from "@/context/auth";
import { useCurrentTime } from "@/context/current-time";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ClockIcon, LogOutIcon } from "lucide-react";

export const BasicHeader = () => {
  const { currentTime } = useCurrentTime();
  const { signOut } = useAuth();

  return (
    <header className="border-b px-8">
      <div className="flex items-center justify-between h-16">
        <Link to="/">
          <Logo className="h-4 text-white" />
        </Link>
        <div className="flex items-center">
          <div className="w-44 flex items-center gap-2">
            <ClockIcon className="size-4 text-primary" />
            <div className="text-sm text-foreground">
              {format(currentTime, "dd.MM.yyyy HH:mm:ss")}
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={signOut} className="ml-2">
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
