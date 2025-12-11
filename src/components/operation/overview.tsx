import { cn } from "@/lib/cn";
import { operations$ } from "@/livestore/queries/operation/operations";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const OperationsOverview = ({ className }: { className?: string }) => {
  const { store } = useStore();
  const operations = store.useQuery(operations$()) as Operation[];

  return (
    <Card className={cn("py-0 gap-0", className)}>
      <CardHeader className="border-b pt-6 bg-white/4">
        <CardTitle className="text-2xl bold">Einsätze</CardTitle>
        <CardDescription>
          Hier kannst Du laufende und vergangene Einsätze verwalten und
          einsehen.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto">
        <ul>
          {operations.map((operation) => (
            <li
              key={operation.id}
              className="relative p-6 border-b last:border-b-0 hover:bg-white/4"
            >
              <Link
                to={`/einsatz/$operationSlug`}
                params={{ operationSlug: operation.slug }}
              >
                <span className="absolute inset-0" />
                <h3 className="text-base font-medium">
                  {operation.description}
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
