import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "../components/header";
import { CurrentTimeProvider } from "../context/current-time";

export const Route = createRootRoute({
  component: () => (
    <CurrentTimeProvider>
      <div className="text-lg text-gray-400 bg-gray-950">
        <Header />
        <main className="h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
        <TanStackRouterDevtools />
      </div>
    </CurrentTimeProvider>
  ),
});
