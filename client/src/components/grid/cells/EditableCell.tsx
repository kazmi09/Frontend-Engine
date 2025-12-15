import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ColumnConfig } from "@/lib/grid/types";
import { useGridUpdate } from "@/lib/grid/hooks";
import { useAuthStore } from "@/lib/auth/store";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditableCellProps {
  value: any;
  rowId: string;
  column: ColumnConfig;
  width: number;
}

export const EditableCell = ({ value: initialValue, rowId, column, width }: EditableCellProps) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateMutation = useGridUpdate();
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state if prop changes (e.g. from rollback)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const hasPermission = !column.requiredPermissions || column.requiredPermissions.includes(user.role);
  const isEditable = column.editable && hasPermission;

  const validate = (val: any) => {
    if (column.validator) {
      return column.validator(val);
    }
    return null;
  };

  const onCommit = () => {
    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      // Keep editing if error? Or show error state?
      // Requirement says "Visual 'saving' and 'error' states"
      // We'll keep editing active but show error
      return; 
    }
    
    setError(null);
    setIsEditing(false);
    if (value !== initialValue) {
      updateMutation.mutate({ rowId, columnId: column.id, value });
    }
  };

  const onCancel = () => {
    setIsEditing(false);
    setValue(initialValue);
    setError(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onCommit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  if (!isEditable) {
     if (column.type === "boolean") {
         return (
             <div className="flex items-center justify-center h-full w-full opacity-60">
                 <Checkbox checked={!!value} disabled />
             </div>
         )
     }
    return (
        <div className="px-3 py-1.5 h-full flex items-center truncate text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50">
            {column.type === "date" && value ? new Date(value).toLocaleDateString() : String(value ?? "")}
        </div>
    );
  }

  // Boolean is always "live" (toggle immediately)
  if (column.type === "boolean") {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Checkbox 
          checked={!!value} 
          onCheckedChange={(checked) => {
             setValue(checked);
             updateMutation.mutate({ rowId, columnId: column.id, value: checked });
          }}
        />
      </div>
    );
  }

  if (isEditing) {
    if (column.type === "select" && column.options) {
        return (
             <select
                className="w-full h-full px-2 bg-white dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={onCommit}
                autoFocus
             >
                 {column.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
             </select>
        );
    }

    return (
      <div className="relative w-full h-full">
        <input
          ref={inputRef}
          className={cn(
              "w-full h-full px-3 bg-white dark:bg-neutral-800 border-2 focus:outline-none text-sm absolute inset-0 z-20",
              error ? "border-destructive text-destructive" : "border-primary",
              column.type === "number" && "text-right"
          )}
          type={column.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => {
             const val = column.type === "number" ? Number(e.target.value) : e.target.value;
             setValue(val);
             if (error) setError(validate(val)); // Clear error on change if valid
          }}
          onBlur={onCommit}
          onKeyDown={onKeyDown}
        />
        {error && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 text-destructive pointer-events-none">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  }

  // Display Mode
  return (
    <div 
      className={cn(
          "w-full h-full px-3 py-1.5 flex items-center cursor-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors truncate group/cell relative",
          column.type === "number" && "justify-end font-mono",
          updateMutation.isPending && "opacity-50"
      )}
      onClick={() => setIsEditing(true)}
    >
        {column.type === "date" && value ? new Date(value).toLocaleDateString() : String(value ?? "")}
        
        {/* Edit Pencil Icon (Subtle) */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
           {/* We could add an icon here if desired */}
        </div>
    </div>
  );
};
