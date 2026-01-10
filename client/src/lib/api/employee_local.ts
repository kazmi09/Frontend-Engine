import { DataResult } from "../grid/types";

const API_BASE = "/api";

export const employeeLocalApi = {
  getAll: async (
    pageIndex: number = 0,
    pageSize: number = 20,
    searchText: string = "",
    filterBy: string = ""
  ): Promise<DataResult> => {
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

    const response = await fetch(
      `${API_BASE}/employees_local?${params.toString()}`
    );

    if (!response.ok) {
      let errorMessage = "Failed to fetch employees_local";
      try {
        const err = await response.json();
        errorMessage = err.message || err.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return response.json();
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
      const error = await response.json().catch(() => ({ error: "Failed to update order" }));
      throw new Error(error.message || error.error || "Failed to update order");
    }
    
    return response.json();
  },
};

