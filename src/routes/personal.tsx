import { ForcesPage } from "@/components/pages/forces";

export const Route = createFileRoute({
  component: Forces,
});

function Forces() {
  return <ForcesPage />;
}
