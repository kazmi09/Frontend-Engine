import { DataResult } from "../grid/types";
import EmployeeDetailPanel from "@/components/grid/EmployeeDetailPanel.vue";

const API_BASE = "/api";

export const employeeLocalApi = {
  getAll: async (
    pageIndex: number = 0,
    pageSize: number = 20,
    searchText: string = "",
    filterBy: string = ""
  ): Promise<DataResult> => {
    console.log('API call with params:', { pageIndex, pageSize, searchText, filterBy })
    
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

    const url = `${API_BASE}/employees_local?${params.toString()}`
    console.log('Fetching URL:', url)

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = "Failed to fetch employees_local";
      try {
        const err = await response.json();
        errorMessage = err.message || err.error || errorMessage;
      } catch {}
      console.error('API Error:', errorMessage)
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('API Response:', result)
    
    // Add expandable configuration
    result.expandable = {
      renderer: EmployeeDetailPanel,
      requiredPermissions: ['admin', 'editor', 'viewer'], // All roles can expand
      canExpand: () => true, // All rows can be expanded
    };
    
    return result;
  },

  updateField: async ({ rowId, columnId, value }: { rowId: string; columnId: string; value: any }) => {
    const response = await fetch(`${API_BASE}/employee_local/${rowId}/field`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field: columnId, value }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to update employee" }));
      throw new Error(error.message || error.error || "Failed to update employee");
    }
    
    return response.json();
  },

  // Bulk operations
  bulkEdit: async (selectedIds: string[], updates: Record<string, any>) => {
    const response = await fetch(`${API_BASE}/employee_local/bulk/edit`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedIds, updates }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to bulk edit employees" }));
      throw new Error(error.message || error.error || "Failed to bulk edit employees");
    }
    
    return response.json();
  },

  bulkArchive: async (selectedIds: string[]) => {
    const response = await fetch(`${API_BASE}/employee_local/bulk/archive`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedIds }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to archive employees" }));
      throw new Error(error.message || error.error || "Failed to archive employees");
    }
    
    return response.json();
  },

  bulkDelete: async (selectedIds: string[]) => {
    const response = await fetch(`${API_BASE}/employee_local/bulk/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedIds }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to delete employees" }));
      throw new Error(error.message || error.error || "Failed to delete employees");
    }
    
    return response.json();
  },

  exportSelected: async (selectedIds: string[]) => {
    const response = await fetch(`${API_BASE}/employee_local/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedIds }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to export employees" }));
      throw new Error(error.message || error.error || "Failed to export employees");
    }
    
    // Handle CSV download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true };
  },
};