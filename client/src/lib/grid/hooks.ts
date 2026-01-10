import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataResult, DataRow } from "./types";
import { toast } from "@/hooks/use-toast";
import { employeeLocalApi } from "../api/employee_local";

export function useGridUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeLocalApi.updateField,
    onMutate: async ({ rowId, columnId, value }) => {
      // Cancel any outgoing refetches for all employees_local queries
      await queryClient.cancelQueries({ queryKey: ["employees_local"] });

      // Get all matching query data and update them optimistically
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ["employees_local"] });
      
      const previousDataMap = new Map();
      
      queries.forEach((query) => {
        const previousData = query.state.data as DataResult | undefined;
        if (previousData) {
          previousDataMap.set(query.queryKey, previousData);
          // Optimistically update to the new value
          queryClient.setQueryData<DataResult>(query.queryKey, {
            ...previousData,
            rows: previousData.rows.map((row) =>
              row.id === rowId ? { ...row, [columnId]: value } : row
            ),
          });
        }
      });

      return { previousDataMap };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous values for all queries
      if (context?.previousDataMap) {
        context.previousDataMap.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      toast({
        title: "Update Failed",
        description: "Could not save your changes. Data has been rolled back.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // The optimistic update is already applied and visible in the UI
      // The changes are shown immediately via the optimistic update
      console.log("[Grid Update] Successfully saved to database:", { 
        rowId: variables.rowId, 
        columnId: variables.columnId, 
        value: variables.value,
        response: data
      });
      
      // Show a subtle success indicator
      toast({
        title: "Saved",
        description: `Updated ${variables.columnId}`,
        duration: 2000,
      });
      
      // Note: We don't invalidate here to keep the optimistic update visible
      // The refresh button will manually invalidate and fetch fresh data from database
    },
  });
}
