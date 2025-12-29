import { DataResult } from "../grid/types";

const API_BASE = "/api";

export const employeeLocalApi = {
  getAll: async (): Promise<DataResult> => {
    const response = await fetch(`${API_BASE}/employees_local`);
    
    // Check if response is ok
    if (!response.ok) {
      // Try to parse as JSON, but handle non-JSON responses
      let errorMessage = "Failed to fetch employees_local";
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
      } else {
        // If not JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
        } catch {
          // Use default message
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse JSON response
    try {
      return await response.json();
    } catch (error) {
      throw new Error("Invalid JSON response from server");
    }
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

