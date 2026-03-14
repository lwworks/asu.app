import { AuthProvider, AuthGate } from "@/context/auth";
import { OrgProvider, OrgGate, useOrg } from "@/context/org";
import { CurrentTimeProvider } from "@/context/current-time";
import { Livestore } from "@/livestore";
import {
  createRootRoute,
  Outlet,
  Navigate,
} from "@tanstack/react-router";

function AppShell() {
  const { currentOrg, syncToken } = useOrg();

  return (
    <Livestore orgId={currentOrg!.orgId} syncToken={syncToken!}>
      <CurrentTimeProvider>
        <div className="text-lg text-muted-foreground bg-background">
          <Outlet />
        </div>
      </CurrentTimeProvider>
    </Livestore>
  );
}

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <AuthGate fallback={<Navigate to="/anmelden" />}>
        <OrgProvider>
          <OrgGate fallback={<Navigate to="/organisationen" />}>
            <AppShell />
          </OrgGate>
        </OrgProvider>
      </AuthGate>
    </AuthProvider>
  ),
});
