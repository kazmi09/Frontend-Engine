import { useQuery } from "@tanstack/react-query";
import { DataGrid } from "@/components/grid/DataGrid";
import { GridToolbar } from "@/components/grid/GridToolbar";
import { fetchMockData } from "@/lib/mock/data";

export default function Dashboard() {
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["grid-data"],
    queryFn: fetchMockData,
    staleTime: 60000, // 1 min cache
  });

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
      </main>
    </div>
  );
}
