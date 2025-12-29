import React, { useCallback, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { useGridStore } from "@/lib/grid/store";
import { DataResult, ColumnConfig } from "@/lib/grid/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { EditableCell } from "@/components/grid/cells/EditableCell";
import { Button } from "@/components/ui/button";

interface DataGridProps {
  data: DataResult;
  isLoading?: boolean;
}

export const DataGrid = ({ data, isLoading }: DataGridProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { 
    columnVisibility, columnOrder, columnPinning, columnSizing, sorting,
    setColumnVisibility, setColumnOrder, setColumnPinning, setColumnSizing, setSorting,
    pageIndex, pageSize, setPageIndex, setPageSize
  } = useGridStore();

  // Memoize columns definition from config
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!data?.columns) return [];
    return data.columns.map((col) => ({
      accessorKey: col.id,
      header: col.label,
      size: col.width || 150,
      minSize: col.minWidth || 50,
      maxSize: col.maxWidth || 500,
      enablePinning: col.pinned !== false,
      meta: {
        type: col.type,
        config: col,
      },
      cell: (info) => (
        <EditableCell 
          value={info.getValue()} 
          rowId={info.row.original.id}
          column={col}
          width={info.column.getSize()}
        />
      ),
    }));
  }, [data?.columns]);

  const table = useReactTable({
    data: data?.rows || [],
    columns,
    state: {
      columnVisibility,
      columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
      columnPinning,
      columnSizing,
      sorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    debugTable: false,
  });

  const { rows } = table.getRowModel();

  const totalPages = data?.pagination ? Math.ceil(data.pagination.totalRows / data.pagination.pageSize) : 0;
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 bg-primary/20 rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading 10,000+ records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border rounded-md overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
      <div 
        ref={tableContainerRef} 
        className="flex-1 overflow-auto relative w-full"
      >
        <div style={{ width: table.getTotalSize() }} className="min-w-full">
          {/* Header */}
          <div className="sticky top-0 z-20 flex bg-slate-50 dark:bg-slate-900 border-b shadow-sm w-full">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex w-full">
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned();
                  return (
                    <div
                      key={header.id}
                      className={cn(
                        "flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r select-none group relative bg-slate-50 dark:bg-slate-900",
                        isPinned === "left" && "sticky left-0 z-20 border-r-2 border-r-primary/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                        isPinned === "right" && "sticky right-0 z-20 border-l-2 border-l-primary/20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      )}
                      style={{
                        width: header.getSize(),
                        left: isPinned === "left" ? `${header.column.getStart("left")}px` : undefined,
                        right: isPinned === "right" ? `${header.column.getAfter("right")}px` : undefined,
                      }}
                    >
                      <div 
                        className="flex items-center gap-2 cursor-pointer w-full hover:text-foreground transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp className="w-3 h-3 text-primary" />,
                          desc: <ChevronDown className="w-3 h-3 text-primary" />,
                        }[header.column.getIsSorted() as string] ?? <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
                      </div>
                      
                      {/* Resize Handle */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 touch-none",
                          header.column.getIsResizing() && "bg-primary w-1"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="w-full">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className={cn(
                  "flex w-full border-b transition-colors bg-white dark:bg-neutral-900 group h-[35px]",
                  index % 2 === 0 ? "bg-white dark:bg-neutral-900" : "bg-slate-50/30 dark:bg-white/[0.02]",
                  "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                )}
              >
                {row.getVisibleCells().map((cell) => {
                   const isPinned = cell.column.getIsPinned();
                   return (
                    <div
                      key={cell.id}
                      className={cn(
                        "flex items-center border-r truncate p-0",
                        isPinned === "left" && "sticky left-0 z-10 bg-white dark:bg-neutral-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50 border-r-2 border-r-primary/10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                        isPinned === "right" && "sticky right-0 z-10 bg-white dark:bg-neutral-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50 border-l-2 border-l-primary/10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      )}
                      style={{
                        width: cell.column.getSize(),
                        left: isPinned === "left" ? `${cell.column.getStart("left")}px` : undefined,
                        right: isPinned === "right" ? `${cell.column.getAfter("right")}px` : undefined,
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer / Pagination Bar */}
      <div className="bg-slate-50 dark:bg-neutral-950 border-t p-3 text-xs text-muted-foreground flex justify-between items-center">
        <span>{data?.pagination ? `Page ${pageIndex + 1} of ${totalPages} • ${data.pagination.totalRows.toLocaleString()} Total Records` : `${data?.rows.length.toLocaleString()} Records`}</span>
        <div className="flex items-center gap-2">
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 rounded border bg-white dark:bg-neutral-900 text-xs"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={!canPreviousPage}
            className="text-xs h-8"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={!canNextPage}
            className="text-xs h-8"
          >
            Next
          </Button>
          <span className="text-xs ml-2">Paginated • Enterprise Mode</span>
        </div>
      </div>
    </div>
  );
};
