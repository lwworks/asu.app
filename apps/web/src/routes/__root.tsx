import { AuthProvider } from "@/context/auth";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <div className="text-lg text-muted-foreground bg-background">
        <Outlet />
      </div>
    </AuthProvider>
  ),
});
