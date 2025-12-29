import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataGrid } from "@/components/grid/DataGrid";
import { GridToolbar } from "@/components/grid/GridToolbar";
import { employeeApi } from "@/lib/api/employees";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useGridStore } from "@/lib/grid/store";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { pageIndex, pageSize } = useGridStore();
  
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["grid-data", pageIndex, pageSize],
    queryFn: () => employeeApi.getAll(pageIndex, pageSize),
    staleTime: 60000, // 1 min cache
  });

  const seedMutation = useMutation({
    mutationFn: () => employeeApi.seed(10000),
    onSuccess: (result) => {
      toast({
        title: "Database Seeded",
        description: `Successfully created ${result.count} employee records`,
      });
      queryClient.invalidateQueries({ queryKey: ["grid-data"] });
    },
    onError: (error: any) => {
      toast({
        title: "Seed Failed",
        description: error.message || "Failed to seed database",
        variant: "destructive",
      });
    },
  });

  const showSeedButton = data?.rows.length === 0 && !isLoading;

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-neutral-950 overflow-hidden">
      {/* Top Navigation - Enterprise Style */}
      <header className="h-14 border-b bg-white dark:bg-neutral-900 flex items-center px-6 justify-between flex-none z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold font-mono">
            N
          </div>
          <span className="font-semibold text-lg tracking-tight">Nexus<span className="text-muted-foreground font-normal">Grid</span></span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Enterprise Edition</span>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
         {showSeedButton ? (
           <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-neutral-900 border rounded-lg shadow-sm">
             <Database className="w-16 h-16 text-muted-foreground mb-4" />
             <h2 className="text-2xl font-semibold mb-2">Database is Empty</h2>
             <p className="text-muted-foreground mb-6 text-center max-w-md">
               Start by seeding the database with sample employee records to see the grid in action.
             </p>
             <Button 
               onClick={() => seedMutation.mutate()}
               disabled={seedMutation.isPending}
               size="lg"
             >
               {seedMutation.isPending ? "Seeding..." : "Seed 10,000 Records"}
             </Button>
           </div>
         ) : (
           <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900 border rounded-lg shadow-sm overflow-hidden min-h-0">
              <GridToolbar 
                onRefresh={() => refetch()} 
                isRefetching={isRefetching}
                data={data}
              />
              <div className="flex-1 overflow-hidden min-h-0">
                 <DataGrid data={data!} isLoading={isLoading} />
              </div>
           </div>
         )}
      </main>
    </div>
  );
}
