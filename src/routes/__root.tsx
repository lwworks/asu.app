import { Header } from "@/components/header";
import { CurrentTimeProvider } from "@/context/current-time";
import { Livestore } from "@/livestore";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <Livestore>
      <CurrentTimeProvider>
        <div className="text-lg text-zinc-400 bg-zinc-950">
          <Header />
          <main className="h-[calc(100vh-4rem)]">
            <Outlet />
          </main>
        </div>
      </CurrentTimeProvider>
    </Livestore>
  ),
});
