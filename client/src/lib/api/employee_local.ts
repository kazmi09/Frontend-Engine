import { DataResult } from "../grid/types";

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
      const error = await response.json().catch(() => ({ error: "Failed to update order" }));
      throw new Error(error.message || error.error || "Failed to update order");
    }
    
    return response.json();
  },
};