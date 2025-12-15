import { DataResult, ColumnConfig, DataRow } from "../grid/types";

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Legal", "Product"];
const STATUSES = ["Active", "Inactive", "Pending", "Archived"];
const ROLES = ["Admin", "Editor", "Viewer", "Contributor"];

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateMockData(count: number): DataResult {
  const columns: ColumnConfig[] = [
    { id: "id", label: "ID", type: "string", width: 80, pinned: "left", editable: false },
    { 
      id: "firstName", 
      label: "First Name", 
      type: "string", 
      width: 150, 
      editable: true,
      validator: (val) => val.length < 2 ? "Name too short" : null 
    },
    { id: "lastName", label: "Last Name", type: "string", width: 150, editable: true },
    { 
      id: "email", 
      label: "Email", 
      type: "string", 
      width: 250, 
      editable: true,
      validator: (val) => !val.includes("@") ? "Invalid email" : null
    },
    { id: "department", label: "Department", type: "select", options: DEPARTMENTS, width: 180, editable: true },
    { id: "role", label: "Role", type: "select", options: ROLES, width: 150, editable: true },
    { id: "status", label: "Status", type: "select", options: STATUSES, width: 120, editable: true },
    { id: "joiningDate", label: "Joining Date", type: "date", width: 150, editable: true },
    { 
      id: "salary", 
      label: "Salary", 
      type: "number", 
      width: 120, 
      editable: true, 
      requiredPermissions: ["admin"],
      validator: (val) => val < 0 ? "Salary cannot be negative" : null
    },
    { id: "lastLogin", label: "Last Login", type: "date", width: 180, editable: false },
    { 
      id: "performanceScore", 
      label: "Perf. Score", 
      type: "number", 
      width: 120, 
      editable: true,
      validator: (val) => (val < 0 || val > 100) ? "Score must be 0-100" : null
    },
    { id: "isRemote", label: "Remote", type: "boolean", width: 100, editable: true },
    { id: "manager", label: "Manager", type: "string", width: 180, editable: true },
    { id: "notes", label: "Notes", type: "string", width: 300, editable: true },
  ];

  const rows: DataRow[] = Array.from({ length: count }).map((_, i) => ({
    id: `EMP-${1000 + i}`,
    firstName: ["James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas", "Charles"][i % 10],
    lastName: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"][i % 10],
    email: `employee${i}@nexus.corp`,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    role: ROLES[i % ROLES.length],
    status: STATUSES[i % STATUSES.length],
    joiningDate: randomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0],
    salary: 50000 + Math.floor(Math.random() * 100000),
    lastLogin: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    performanceScore: Math.floor(Math.random() * 100),
    isRemote: Math.random() > 0.5,
    manager: ["Sarah Connor", "John Doe", "Jane Smith"][i % 3],
    notes: i % 5 === 0 ? "Needs review" : "On track",
  }));

  return {
    primaryKey: "id",
    columns,
    rows,
  };
}

// Simulate backend latency
export const fetchMockData = async (): Promise<DataResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockData(10000)); // 10k rows
    }, 800);
  });
};
