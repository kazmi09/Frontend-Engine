import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ColumnConfig } from "@/lib/grid/types";
import { useGridUpdate } from "@/lib/grid/hooks";
import { useAuthStore } from "@/lib/auth/store";
import { AlertCircle, Check, X } from "lucide-react";

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
             <div className="flex items-center justify-center h-full w-full px-3 py-1.5">
                 <div className={cn(
                   "w-4 h-4 rounded border flex items-center justify-center opacity-60",
                   !!value ? "bg-slate-300 border-slate-400" : "border-slate-300"
                 )}>
                   {!!value && <Check className="w-3 h-3 text-slate-600" />}
                 </div>
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
      <div 
        className="flex items-center justify-center h-full w-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5"
        onClick={() => {
          const newValue = !value;
          setValue(newValue);
          updateMutation.mutate({ rowId, columnId: column.id, value: newValue });
        }}
      >
        <div className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
          value ? "bg-primary border-primary" : "border-input"
        )}>
          {value && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
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
             if (error) setError(validate(val));
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
    </div>
  );
};
