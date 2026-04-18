import { AuthGate } from "@/context/auth";
import { OrgProvider, OrgGate, useOrg } from "@/context/org";
import { CurrentTimeProvider } from "@/context/current-time";
import { Livestore } from "@/livestore";
import { Outlet, Navigate } from "@tanstack/react-router";

function AppShell() {
  const { currentOrg, syncToken } = useOrg();

  return (
    <Livestore orgId={currentOrg!.orgId} syncToken={syncToken!}>
      <Outlet />
    </Livestore>
  );
}

export const Route = createFileRoute({
  component: () => (
    <AuthGate fallback={<Navigate to="/anmelden" />}>
      <OrgProvider>
        <CurrentTimeProvider>
          <OrgGate fallback={<Navigate to="/neue-organisation" />}>
            <AppShell />
          </OrgGate>
        </CurrentTimeProvider>
      </OrgProvider>
    </AuthGate>
  ),
});
