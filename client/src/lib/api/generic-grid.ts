import { DataResult } from "../grid/types";

const API_BASE = "/api";

export interface GridApiConfig {
  gridId: string
  expandableComponent?: any
}

export function createGridApi(config: GridApiConfig) {
  const { gridId, expandableComponent } = config

  return {
    getAll: async (
      pageIndex: number = 0,
      pageSize: number = 20,
      searchText: string = "",
      filterBy: string = "",
      sortBy: Array<{ id: string; desc: boolean }> = []
    ): Promise<DataResult> => {
      console.log(`[${gridId}] API call with params:`, { pageIndex, pageSize, searchText, filterBy, sortBy })
      
      const offset = pageIndex * pageSize;
      const limit = pageSize;

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (searchText) {
        params.append("search", searchText);
      }
      if (filterBy) {
        params.append("filterBy", filterBy);
      }
      if (sortBy.length > 0) {
        params.append("sortBy", JSON.stringify(sortBy));
      }

      const url = `${API_BASE}/grid/${gridId}/data?${params.toString()}`
      console.log(`[${gridId}] Fetching URL:`, url)

      const response = await fetch(url);

      if (!response.ok) {
        let errorMessage = `Failed to fetch ${gridId} data`;
        try {
          const err = await response.json();
          errorMessage = err.message || err.error || errorMessage;
        } catch {}
        console.error(`[${gridId}] API Error:`, errorMessage)
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`[${gridId}] API Response:`, result)
      
      // Add expandable component if provided
      if (expandableComponent && result.expandable) {
        result.expandable.renderer = expandableComponent;
      }
      
      return result;
    },

    updateField: async ({ rowId, columnId, value }: { rowId: string; columnId: string; value: any }) => {
      const response = await fetch(`${API_BASE}/grid/${gridId}/field`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rowId, field: columnId, value }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed to update ${gridId} record` }));
        throw new Error(error.message || error.error || `Failed to update ${gridId} record`);
      }
      
      return response.json();
    },

    // Bulk operations
    bulkEdit: async (selectedIds: string[], updates: Record<string, any>) => {
      const response = await fetch(`${API_BASE}/grid/${gridId}/bulk/edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedIds, updates }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed to bulk edit ${gridId} records` }));
        throw new Error(error.message || error.error || `Failed to bulk edit ${gridId} records`);
      }
      
      return response.json();
    },

    bulkArchive: async (selectedIds: string[]) => {
      const response = await fetch(`${API_BASE}/grid/${gridId}/bulk/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedIds }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed to archive ${gridId} records` }));
        throw new Error(error.message || error.error || `Failed to archive ${gridId} records`);
      }
      
      return response.json();
    },

    bulkDelete: async (selectedIds: string[]) => {
      const response = await fetch(`${API_BASE}/grid/${gridId}/bulk/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedIds }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed to delete ${gridId} records` }));
        throw new Error(error.message || error.error || `Failed to delete ${gridId} records`);
      }
      
      return response.json();
    },

    exportSelected: async (selectedIds: string[]) => {
      const response = await fetch(`${API_BASE}/grid/${gridId}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedIds }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed to export ${gridId} records` }));
        throw new Error(error.message || error.error || `Failed to export ${gridId} records`);
      }
      
      // Handle CSV download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gridId}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },

    // Get grid configuration
    getConfig: async () => {
      const response = await fetch(`${API_BASE}/grid/${gridId}/config`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed to fetch ${gridId} config` }));
        throw new Error(error.message || error.error || `Failed to fetch ${gridId} config`);
      }
      
      return response.json();
    }
  };
}

// Get all available grids
export async function getAllGrids() {
  const response = await fetch(`${API_BASE}/grids`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch available grids" }));
    throw new Error(error.message || error.error || "Failed to fetch available grids");
  }
  
  return response.json();
}