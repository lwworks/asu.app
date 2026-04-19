import { SettingsPage } from "@/components/pages/settings";

export const Route = createFileRoute({
  component: Settings,
});

function Settings() {
  return <SettingsPage />;
}
