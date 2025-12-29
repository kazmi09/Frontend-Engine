import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, updateEmployeeSchema } from "@shared/schema";
import { z } from "zod";

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Legal", "Product"];
const STATUSES = ["Active", "Inactive", "Pending", "Archived"];
const ROLES = ["Admin", "Editor", "Viewer", "Contributor"];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all employees (with optional pagination)
  app.get("/api/employees", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      
      const { rows: employees, total } = await storage.getEmployeesPaginated(limit, offset);
      
      // Transform to match frontend DataResult format
      const result = {
        primaryKey: "id",
        columns: [
          { id: "id", label: "ID", type: "string", width: 80, pinned: "left", editable: false },
          { 
            id: "firstName", 
            label: "First Name", 
            type: "string", 
            width: 150, 
            editable: true,
          },
          { id: "lastName", label: "Last Name", type: "string", width: 150, editable: true },
          { 
            id: "email", 
            label: "Email", 
            type: "string", 
            width: 250, 
            editable: true,
          },
          { 
            id: "department", 
            label: "Department", 
            type: "select", 
            options: DEPARTMENTS,
            width: 180, 
            editable: true 
          },
          { 
            id: "role", 
            label: "Role", 
            type: "select", 
            options: ROLES,
            width: 150, 
            editable: true 
          },
          { 
            id: "status", 
            label: "Status", 
            type: "select", 
            options: STATUSES,
            width: 120, 
            editable: true 
          },
          { id: "joiningDate", label: "Joining Date", type: "date", width: 150, editable: true },
          { 
            id: "salary", 
            label: "Salary", 
            type: "number", 
            width: 120, 
            editable: true, 
            requiredPermissions: ["admin"],
          },
          { id: "lastLogin", label: "Last Login", type: "date", width: 180, editable: false },
          { 
            id: "performanceScore", 
            label: "Perf. Score", 
            type: "number", 
            width: 120, 
            editable: true,
          },
          { id: "isRemote", label: "Remote", type: "boolean", width: 100, editable: true },
          { id: "manager", label: "Manager", type: "string", width: 180, editable: true },
          { id: "notes", label: "Notes", type: "string", width: 300, editable: true },
        ],
        rows: employees.map(emp => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          department: emp.department,
          role: emp.role,
          status: emp.status,
          joiningDate: emp.joiningDate,
          salary: emp.salary,
          lastLogin: emp.lastLogin.toISOString(),
          performanceScore: emp.performanceScore,
          isRemote: emp.isRemote,
          manager: emp.manager,
          notes: emp.notes,
        })),
        pagination: {
          pageIndex: Math.floor(offset / limit),
          pageSize: limit,
          totalRows: total,
        }
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  // Create a new employee
  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        console.error("Error creating employee:", error);
        res.status(500).json({ error: "Failed to create employee" });
      }
    }
  });

  // Update a single field (optimized for inline editing)
  app.patch("/api/employees/:id/field", async (req, res) => {
    try {
      const { id } = req.params;
      const { field, value } = req.body;
      
      if (!field || value === undefined) {
        return res.status(400).json({ error: "Field and value are required" });
      }

      const employee = await storage.updateEmployeeField(id, field, value);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error updating employee field:", error);
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  // Update entire employee
  app.put("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        console.error("Error updating employee:", error);
        res.status(500).json({ error: "Failed to update employee" });
      }
    }
  });

  // Delete an employee
  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  // Seed data endpoint (for initial setup)
  app.post("/api/employees/seed", async (req, res) => {
    try {
      const { count = 100 } = req.body;
      const employees = await storage.getAllEmployees();
      
      // Only seed if database is empty
      if (employees.length > 0) {
        return res.status(400).json({ error: "Database already contains data" });
      }

      const seedData = Array.from({ length: count }).map((_, i) => ({
        id: `EMP-${1000 + i}`,
        firstName: ["James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas", "Charles"][i % 10],
        lastName: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"][i % 10],
        email: `employee${i}@nexus.corp`,
        department: DEPARTMENTS[i % DEPARTMENTS.length],
        role: ROLES[i % ROLES.length],
        status: STATUSES[i % STATUSES.length],
        joiningDate: randomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0],
        salary: 50000 + Math.floor(Math.random() * 100000),
        performanceScore: Math.floor(Math.random() * 100),
        isRemote: Math.random() > 0.5,
        manager: ["Sarah Connor", "John Doe", "Jane Smith"][i % 3],
        notes: i % 5 === 0 ? "Needs review" : "On track",
      }));

      const created = await storage.bulkCreateEmployees(seedData);
      res.json({ message: `Seeded ${created.length} employees`, count: created.length });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  return httpServer;
}
