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
import { events } from "@/livestore/schema";
import type { Force } from "@/livestore/schema/force";
import { useStore } from "@livestore/react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArchiveIcon,
  ArrowDownAZ,
  ArrowDownZA,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { IconOutline } from "../visuals/icon-outline";

export const ForcesTable = () => {
  const { store } = useStore();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const forces = store.useQuery(forcesByOrganization$("all"));

  const handleArchiveForce = (id: string) => {
    store.commit(events.forceArchived({ id, archivedAt: new Date() }));
  };

  const columns: ColumnDef<Force>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        const sorting = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            className="px-0! text-xs uppercase tracking-wide"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            {sorting === "asc" && <ArrowDownAZ className="size-4" />}
            {sorting === "desc" && <ArrowDownZA className="size-4" />}
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="text-foreground">{row.original.name}</span>;
      },
    },
    {
      accessorKey: "organization",
      header: ({ column }) => {
        const sorting = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            className="px-0! text-xs uppercase tracking-wide"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Organisation
            {sorting === "asc" && <ArrowDownAZ className="size-4" />}
            {sorting === "desc" && <ArrowDownZA className="size-4" />}
          </Button>
        );
      },
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
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <PencilIcon className="size-3.5" />
                <span>Bearbeiten</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleArchiveForce(row.original.id)}
              >
                <ArchiveIcon className="size-3.5" />
                <span>Archivieren</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: forces as Force[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <Card className="flex-1 py-0 gap-0">
      <CardHeader className="py-6 border-b bg-white/4 flex items-center justify-between">
        <CardTitle className="text-2xl">Verfügbares Personal</CardTitle>
        <div className="flex items-start gap-2">
          <div className="relative">
            <Input
              className="pl-9"
              placeholder="Personal suchen..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
            />
            <SearchIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button disabled>
            <PlusIcon className="size-4" />
            <span>Personal hinzufügen</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4.25rem)] overflow-auto">
        <Table wrapperClassName="overflow-x-visible">
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-white/4 hover:bg-white/4"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-left text-muted-foreground uppercase tracking-wide text-xs pl-6"
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
            <div className="absolute h-px bg-border inset-x-0 bottom-0" />
          </TableHeader>
          <TableBody className="text-muted-foreground">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="pl-6">
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
                  className="bg-card hover:bg-card"
                >
                  <div className="h-96 w-full flex items-center justify-center flex-col gap-8">
                    <IconOutline className="h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      Kein Personal gefunden.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
