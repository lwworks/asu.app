import { CurrentTimeProvider } from "@/context/current-time";
import { Livestore } from "@/livestore";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <Livestore>
      <CurrentTimeProvider>
        <div className="text-lg text-muted-foreground bg-background">
          <Outlet />
        </div>
      </CurrentTimeProvider>
    </Livestore>
  ),
});
