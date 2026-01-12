import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { DataResult } from "@/lib/grid/types";
import { employeeLocalApi } from "@/lib/api/employee_local";
import { ref } from 'vue';
import { useQuasar } from 'quasar';

// Global state to track which cell is currently being updated
const updatingCells = ref(new Set<string>());

export function useGridUpdate() {
  const queryClient = useQueryClient();
  const $q = useQuasar();

  const mutation = useMutation({
    mutationFn: employeeLocalApi.updateField,
    onMutate: async ({ rowId, columnId, value }) => {
      // Track this specific cell as updating
      const cellKey = `${rowId}-${columnId}`;
      updatingCells.value.add(cellKey);

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

      return { previousDataMap, cellKey };
    },
    onError: (err, variables, context) => {
      // Remove from updating cells
      if (context?.cellKey) {
        updatingCells.value.delete(context.cellKey);
      }

      // Rollback to the previous values for all queries
      if (context?.previousDataMap) {
        context.previousDataMap.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      
      $q.notify({
        type: 'negative',
        message: 'Update Failed',
        caption: 'Could not save your changes. Data has been rolled back.',
        position: 'top-right',
      });
    },
    onSuccess: (data, variables) => {
      // Remove from updating cells
      const cellKey = `${variables.rowId}-${variables.columnId}`;
      updatingCells.value.delete(cellKey);

      // The optimistic update is already applied and visible in the UI
      console.log("[Grid Update] Successfully saved to database:", { 
        rowId: variables.rowId, 
        columnId: variables.columnId, 
        value: variables.value,
        response: data
      });
      
      // Show a subtle success indicator
      $q.notify({
        type: 'positive',
        message: 'Saved',
        caption: `Updated ${variables.columnId}`,
        timeout: 2000,
        position: 'top-right',
      });
    },
  });

  // Function to check if a specific cell is updating
  const isCellUpdating = (rowId: string, columnId: string) => {
    const cellKey = `${rowId}-${columnId}`;
    return updatingCells.value.has(cellKey);
  };

  return {
    ...mutation,
    isCellUpdating,
  };
}