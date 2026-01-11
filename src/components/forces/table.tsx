import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { forcesByOrganization$ } from "@/livestore/queries/force/forces-by-organization";
import type { Force } from "@/livestore/schema/force";
import { useStore } from "@livestore/react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";

const columns: ColumnDef<Force>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      return <span className="text-foreground">{row.original.name}</span>;
    },
  },
  {
    header: "Organisation",
    accessorKey: "organization",
  },
  {
    header: "Belastungsübung",
    accessorKey: "annualTraining",
    cell: ({ row }) => {
      return row.original.annualTraining
        ? format(row.original.annualTraining, "dd.MM.yyyy")
        : "-";
    },
  },
  {
    header: "G26.3",
    accessorKey: "medicalCheck",
    cell: ({ row }) => {
      return row.original.medicalCheck
        ? format(row.original.medicalCheck, "dd.MM.yyyy")
        : "-";
    },
  },
  {
    header: "Letzte Aktualisierung",
    accessorKey: "updatedAt",
    cell: ({ row }) => {
      return format(row.original.updatedAt, "dd.MM.yyyy HH:mm");
    },
  },
];

export const ForcesTable = () => {
  const { store } = useStore();
  const forces = store.useQuery(forcesByOrganization$("all"));

  const table = useReactTable({
    data: forces as Force[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="flex-1 py-0 gap-0">
      <CardHeader className="pt-6 bg-white/4 h-17">
        <CardTitle className="text-2xl mb-1">Verfügbares Personal</CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4.25rem)] overflow-auto">
        <Table wrapperClassName="overflow-x-visible">
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-white/4 hover:bg-white/4"
              >
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-left text-muted-foreground uppercase tracking-wide text-xs",
                        index === 0 ? "px-6" : "pr-6"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
            {/* <TableRow className="bg-white/4 hover:bg-white/4">
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
            </TableRow> */}
            <div className="absolute h-px bg-border inset-x-0 bottom-0" />
          </TableHeader>
          <TableBody className="text-muted-foreground">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn(index === 0 ? "px-6" : "pr-6")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
            {/* {forces.map((force) => (
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
            ))} */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
