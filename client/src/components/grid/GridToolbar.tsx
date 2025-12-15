import { Button } from "@/components/ui/button";
import { useGridStore } from "@/lib/grid/store";
import { Download, Filter, LayoutTemplate, RefreshCw, RotateCcw, Settings2, Columns, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataResult } from "@/lib/grid/types";
import { useAuthStore, UserRole } from "@/lib/auth/store";
import { Badge } from "@/components/ui/badge";

interface GridToolbarProps {
  onRefresh: () => void;
  isRefetching: boolean;
  data: DataResult | undefined;
}

export function GridToolbar({ onRefresh, isRefetching, data }: GridToolbarProps) {
  const { resetLayout, columnVisibility, setColumnVisibility } = useGridStore();
  const { user, setRole } = useAuthStore();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Employee Directory</h2>
        <div className="h-6 w-px bg-border mx-2" />
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefetching}
            className="h-8 gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={resetLayout} className="h-8 gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Layout
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Role Switcher for Demo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-8 gap-2 mr-2">
              <UserCog className="h-3.5 w-3.5" />
              Role: <span className="font-semibold capitalize">{user.role}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Simulate Permission</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={user.role} onValueChange={(v) => setRole(v as UserRole)}>
              <DropdownMenuRadioItem value="admin">Admin (Full Access)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="editor">Editor (Can Edit)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="viewer">Viewer (Read Only)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 ml-auto">
              <Columns className="h-3.5 w-3.5" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] max-h-[400px] overflow-auto">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {data?.columns.map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      [column.id]: !!value,
                    }))
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
