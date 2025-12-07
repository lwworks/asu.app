import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Squad } from "@/livestore/schema/operation/squad";

export const SquadCard = ({ squad }: { squad: Squad }) => {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>{squad.name}</CardTitle>
      </CardHeader>
    </Card>
  );
};
