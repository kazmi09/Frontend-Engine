import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataResult, DataRow } from "./types";
import { toast } from "@/hooks/use-toast";

// Mock API update function
const updateRow = async ({ rowId, columnId, value }: { rowId: string; columnId: string; value: any }) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // Simulate random failure (1% chance)
  if (Math.random() < 0.01) {
    throw new Error("Failed to save changes");
  }

  return { rowId, columnId, value };
};

export function useGridUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRow,
    onMutate: async ({ rowId, columnId, value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["grid-data"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<DataResult>(["grid-data"]);

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<DataResult>(["grid-data"], {
          ...previousData,
          rows: previousData.rows.map((row) =>
            row.id === rowId ? { ...row, [columnId]: value } : row
          ),
        });
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      // Rollback to the previous value
      if (context?.previousData) {
        queryClient.setQueryData(["grid-data"], context.previousData);
      }
      toast({
        title: "Update Failed",
        description: "Could not save your changes. Data has been rolled back.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
       // Optional: Show subtle success indicator
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      // queryClient.invalidateQueries({ queryKey: ["grid-data"] });
    },
  });
}
