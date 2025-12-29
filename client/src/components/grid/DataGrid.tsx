import React, { useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useGridStore } from "@/lib/grid/store";
import { DataResult } from "@/lib/grid/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { EditableCell } from "@/components/grid/cells/EditableCell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface DataGridProps {
  data: DataResult;
  isLoading?: boolean;
}

export const DataGrid = ({ data, isLoading }: DataGridProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const {
    columnVisibility,
    columnOrder,
    columnPinning,
    columnSizing,
    sorting,
    setColumnVisibility,
    setColumnOrder,
    setColumnPinning,
    setColumnSizing,
    setSorting,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    rowSelection,
    setRowSelection,
  } = useGridStore();

  /** ---------------- Columns ---------------- */
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!data?.columns) return [];
    
    const selectColumn: ColumnDef<any> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    };
    
    const dataColumns = data.columns.map((col) => ({
      accessorKey: col.id,
      header: col.label,
      size: col.width || 150,
      minSize: col.minWidth || 50,
      maxSize: col.maxWidth || 500,
      enablePinning: col.pinned !== false,
      meta: { type: col.type, config: col },
      cell: (info) => (
        <EditableCell
          value={info.getValue()}
          rowId={info.row.original.id}
          column={col}
          width={info.column.getSize()}
        />
      ),
    }));
    
    return [selectColumn, ...dataColumns];
  }, [data?.columns]);

  /** ---------------- Pagination math ---------------- */
  const totalRows = data?.pagination?.totalRows ?? data?.rows.length ?? 0;
  const totalPages = Math.ceil(totalRows / pageSize);

  /** ---------------- Table ---------------- */
  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    getRowId: (row) => row.id,

    // 🔑 SERVER-SIDE MODE
    manualPagination: true,
    pageCount: totalPages,

    state: {
      columnVisibility,
      columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
      columnPinning,
      columnSizing,
      sorting,
      pagination: { pageIndex, pageSize },
      rowSelection,
    },

    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableMultiRowSelection: true,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
  });

  const { rows } = table.getRowModel();
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  /** ---------------- Loading ---------------- */
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 bg-primary/20 rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">
            Loading records…
          </p>
        </div>
      </div>
    );
  }

  /** ---------------- Render ---------------- */
  return (
    <div className="h-full flex flex-col border rounded-md overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
      <div ref={tableContainerRef} className="flex-1 overflow-auto relative">
        <div style={{ width: table.getTotalSize() }} className="min-w-full">

          {/* HEADER */}
          <div className="sticky top-0 z-20 flex bg-slate-50 dark:bg-slate-900 border-b">
            {table.getHeaderGroups().map((hg) => (
              <div key={hg.id} className="flex w-full">
                {hg.headers.map((header) => {
                  const isPinned = header.column.getIsPinned();
                  return (
                    <div
                      key={header.id}
                      className={cn(
                        "flex items-center px-3 py-2 text-xs font-semibold uppercase border-r select-none relative",
                        isPinned === "left" && "sticky left-0 z-20",
                        isPinned === "right" && "sticky right-0 z-20"
                      )}
                      style={{
                        width: header.getSize(),
                        left: isPinned === "left"
                          ? `${header.column.getStart("left")}px`
                          : undefined,
                        right: isPinned === "right"
                          ? `${header.column.getAfter("right")}px`
                          : undefined,
                      }}
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer w-full"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="w-3 h-3" />,
                          desc: <ChevronDown className="w-3 h-3" />,
                        }[header.column.getIsSorted() as string] ??
                          <ChevronsUpDown className="w-3 h-3 opacity-40" />}
                      </div>

                      <div
                        onMouseDown={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* BODY */}
          <div>
            {rows.map((row, i) => (
              <div
                key={row.id}
                className={cn(
                  "flex border-b h-[35px]",
                  i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const isPinned = cell.column.getIsPinned();
                  return (
                    <div
                      key={cell.id}
                      className={cn(
                        "flex items-center border-r",
                        isPinned === "left" && "sticky left-0 z-10",
                        isPinned === "right" && "sticky right-0 z-10"
                      )}
                      style={{
                        width: cell.column.getSize(),
                        left: isPinned === "left"
                          ? `${cell.column.getStart("left")}px`
                          : undefined,
                        right: isPinned === "right"
                          ? `${cell.column.getAfter("right")}px`
                          : undefined,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t p-3 flex justify-between items-center text-xs">
        <div className="flex items-center gap-4">
          <span>
            Page {pageIndex + 1} of {totalPages} •{" "}
            {totalRows.toLocaleString()} records
          </span>
          {Object.keys(rowSelection).length > 0 && (
            <span className="text-blue-600 font-medium">
              {Object.keys(rowSelection).length} selected
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageIndex(0);
              setPageSize(Number(e.target.value));
            }}
            className="px-2 py-1 border rounded"
          >
            {[10, 20, 50, 100, 200, 500, 1000].map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={!canPreviousPage}
          >
            Previous
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={!canNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
