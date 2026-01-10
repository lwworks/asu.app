import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { forcesByOrganization$ } from "@/livestore/queries/force/forces-by-organization";
import { useStore } from "@livestore/react";
import { format } from "date-fns";

export const ForcesList = () => {
  const { store } = useStore();
  const forces = store.useQuery(forcesByOrganization$("all"));

  return (
    <Card className="flex-1 py-0 gap-0">
      <CardHeader className="pt-6 bg-white/4 h-17">
        <CardTitle className="text-2xl mb-1">Verfügbares Personal</CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4.25rem)] overflow-auto">
        <Table wrapperClassName="overflow-x-visible">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="bg-white/4 hover:bg-white/4">
              <TableHead className="px-6 text-muted-foreground uppercase tracking-wide text-xs">
                Name
              </TableHead>
              <TableHead className="pr-6 text-muted-foreground uppercase tracking-wide text-xs">
                Organisation
              </TableHead>
              <TableHead className="pr-6 text-muted-foreground uppercase tracking-wide text-xs">
                Belastungsübung
              </TableHead>
              <TableHead className="pr-6 text-muted-foreground uppercase tracking-wide text-xs">
                G26.3
              </TableHead>
              <TableHead className="pr-6 text-muted-foreground uppercase tracking-wide text-xs">
                Letzte Aktualisierung
              </TableHead>
            </TableRow>
            <div className="absolute h-px bg-border inset-x-0 bottom-0" />
          </TableHeader>
          <TableBody>
            {forces.map((force) => (
              <TableRow key={force.id}>
                <TableCell className="px-6">{force.name}</TableCell>
                <TableCell className="pr-6">{force.organization}</TableCell>
                <TableCell className="pr-6 text-muted-foreground">
                  {force.annualTraining
                    ? format(force.annualTraining, "dd.MM.yyyy")
                    : "-"}
                </TableCell>
                <TableCell className="pr-6 text-muted-foreground">
                  {force.medicalCheck
                    ? format(force.medicalCheck, "dd.MM.yyyy")
                    : "-"}
                </TableCell>
                <TableCell className="pr-6 text-muted-foreground">
                  {format(force.updatedAt, "dd.MM.yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
