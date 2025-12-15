import { DataResult } from "../grid/types";

const API_BASE = "/api";

export const employeeApi = {
  getAll: async (): Promise<DataResult> => {
    const response = await fetch(`${API_BASE}/employees`);
    if (!response.ok) {
      throw new Error("Failed to fetch employees");
    }
    return response.json();
  },

  updateField: async ({ rowId, columnId, value }: { rowId: string; columnId: string; value: any }) => {
    const response = await fetch(`${API_BASE}/employees/${rowId}/field`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field: columnId, value }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to update employee");
    }
    
    return response.json();
  },

  seed: async (count: number = 10000) => {
    const response = await fetch(`${API_BASE}/employees/seed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to seed data");
    }
    
    return response.json();
  },
};
