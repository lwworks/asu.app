import { AuthGate } from "@/context/auth";
import { OrgProvider } from "@/context/org";
import { Outlet, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute({
  component: () => (
    <AuthGate fallback={<Navigate to="/anmelden" />}>
      <OrgProvider>
        <Outlet />
      </OrgProvider>
    </AuthGate>
  ),
});
