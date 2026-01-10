import { cn } from "@/lib/cn";
import { operations$ } from "@/livestore/queries/operation/operations";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { IconOutline } from "../visuals/icon-outline";
import { OperationCard } from "./card";

type Filter = "running" | "completed" | "archived";

export const OperationsOverview = ({ className }: { className?: string }) => {
  const [filter, setFilter] = useState<Filter>("running");
  const { store } = useStore();
  const operations = store.useQuery(operations$()) as Operation[];

  const filteredOperations: Record<Filter, Operation[]> = {
    running: operations.filter(
      (operation) => !operation.completedAt && !operation.archivedAt
    ),
    completed: operations.filter(
      (operation) => !!operation.completedAt && !operation.archivedAt
    ),
    archived: operations.filter((operation) => !!operation.archivedAt),
  };

  return (
    <Card className={cn("py-0 gap-0", className)}>
      <CardHeader className="border-b pt-6 pb-0! bg-white/4">
        <CardTitle className="text-2xl bold">Einsätze</CardTitle>
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList className="p-0 mt-4 gap-4 h-fit bg-transparent">
            <TabsTrigger
              value="running"
              className="group relative p-0 pb-3 h-fit rounded-none border-none data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent cursor-pointer font-normal"
            >
              <span className="absolute -bottom-px inset-x-0 h-px bg-primary opacity-0 transition-opacity group-data-[state=active]:opacity-100" />
              <span>Laufend</span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="group relative p-0 pb-3 h-fit rounded-none border-none data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent cursor-pointer font-normal"
            >
              <span className="absolute -bottom-px inset-x-0 h-px bg-primary opacity-0 transition-opacity group-data-[state=active]:opacity-100" />
              <span>Beendet</span>
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="group relative p-0 pb-3 h-fit rounded-none border-none data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent cursor-pointer font-normal"
            >
              <span className="absolute -bottom-px inset-x-0 h-px bg-primary opacity-0 transition-opacity group-data-[state=active]:opacity-100" />
              <span>Archiviert</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="relative p-0 h-full overflow-y-auto">
        {filteredOperations[filter].length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-sm pb-16">
            <IconOutline className="h-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              <span>Keine </span>
              {filter === "running" && <span>laufenden</span>}
              {filter === "completed" && <span>beendeten</span>}
              {filter === "archived" && <span>archivierten</span>}
              <span> Einsätze</span>
            </p>
          </div>
        )}
        <ul>
          {filteredOperations[filter].map((operation) => (
            <OperationCard key={operation.id} operation={operation} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
