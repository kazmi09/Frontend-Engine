import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  Row,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useGridStore } from "@/lib/grid/store";
import { DataResult, ColumnConfig } from "@/lib/grid/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown, GripVertical } from "lucide-react";
import { EditableCell } from "@/components/grid/cells/EditableCell";

interface DataGridProps {
  data: DataResult;
  isLoading?: boolean;
}

export const DataGrid = ({ data, isLoading }: DataGridProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { 
    columnVisibility, columnOrder, columnPinning, columnSizing, sorting,
    setColumnVisibility, setColumnOrder, setColumnPinning, setColumnSizing, setSorting 
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

  // Virtualizer for Rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35, // 35px row height
    overscan: 10,
  });

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
          <div
            className="relative w-full"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className={cn(
                    "absolute top-0 left-0 flex w-full border-b transition-colors bg-white dark:bg-neutral-900 group",
                    virtualRow.index % 2 === 0 ? "bg-white dark:bg-neutral-900" : "bg-slate-50/30 dark:bg-white/[0.02]",
                    // Row hover only affects background if we aren't editing, but CSS hover is tricky with controlled inputs
                    // We'll keep it subtle
                    "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  )}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                     const isPinned = cell.column.getIsPinned();
                     return (
                      <div
                        key={cell.id}
                        className={cn(
                          "flex items-center border-r truncate h-[35px] p-0", // Removed padding here, handled in EditableCell
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
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Footer / Status Bar */}
      <div className="bg-slate-50 dark:bg-neutral-950 border-t p-2 text-xs text-muted-foreground flex justify-between items-center">
        <span>{data?.rows.length.toLocaleString()} Records</span>
        <span>Virtualized • Enterprise Mode</span>
      </div>
    </div>
  );
};
