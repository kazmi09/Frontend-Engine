import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, updateEmployeeSchema } from "@shared/schema";
import { z } from "zod";
import { queryMySQL } from "./mysql-db";

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

  // local employee code
  app.get("/api/employees_local", async (req, res) => {
    try {
      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        console.error("[API] DATABASE_URL is not set");
        return res.status(500).json({ 
          error: "Database configuration error", 
          message: "DATABASE_URL environment variable is not set. Please set it to: mysql+mysqlconnector://root:DesiDrop%40123@localhost/desi_drop_beta"
        });
      }

      console.log("[API] Fetching employees from MySQL...");
      
      // Parse pagination parameters
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 1000);
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM employees_temp`;
      const countResult = await queryMySQL<any>(countQuery);
      const totalRows = countResult[0]?.total || 0;
      
      // Get paginated data
      const query = `
        SELECT employee_id,
        first_name, last_name,
        email,
        department,
        job_title,
        salary,
        hire_date 
        FROM employees_temp
        ORDER BY employee_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rows = await queryMySQL<any>(query);
      console.log(`[API] Successfully fetched ${rows.length} employees (${offset + 1}-${offset + rows.length} of ${totalRows})`);

      // Transform to match frontend DataResult format
      const result = {
        primaryKey: "id",
        columns: [
          { 
            id: "employee_id", 
            label: "Employee ID", 
            type: "number", 
            width: 120, 
            pinned: "left", 
            editable: false 
          },
          { 
            id: "first_name", 
            label: "First Name", 
            type: "string", 
            width: 200, 
            editable: true 
          },
          { 
            id: "last_name", 
            label: "Last Name", 
            type: "string", 
            width: 150, 
            editable: true 
          },
          { 
            id: "email", 
            label: "Email", 
            type: "string", 
            width: 300, 
            editable: true 
          },
          { 
            id: "department", 
            label: "Department", 
            type: "string", 
            width: 140, 
            editable: true 
          },
          { 
            id: "job_title", 
            label: "Job Title", 
            type: "string", 
            width: 150, 
            editable: true 
          },
          { 
            id: "salary", 
            label: "Salary", 
            type: "string", 
            width: 250, 
            editable: true 
          },
          { 
            id: "hire_date", 
            label: "Hire Date", 
            type: "date", 
            width: 150, 
            editable: true 
          },
        ],
        rows: rows.map((row, index) => ({
          id: `${row.employee_id}-${index}`, 
          employee_id: row.employee_id,
          first_name: row.first_name || "",
          last_name: row.last_name || "",
          email: row.email || "",
          department: row.department || "",
          job_title: row.job_title || "",
          salary: row.salary || "",
          hire_date: row.hire_date || "",
        })),
        pagination: {
          pageIndex: Math.floor(offset / limit),
          pageSize: limit,
          totalRows: totalRows,
        }
      };
      
      res.json(result);
    } catch (error: any) {
      console.error("[API] Error fetching employees:", error);
      console.error("[API] Error stack:", error.stack);
      
      // Provide more detailed error information
      const errorMessage = error.message || "Database connection error";
      const isConnectionError = errorMessage.includes("ECONNREFUSED") || 
                                errorMessage.includes("ER_ACCESS_DENIED") ||
                                errorMessage.includes("ENOTFOUND") ||
                                errorMessage.includes("ETIMEDOUT");
      
      res.status(500).json({ 
        error: "Failed to fetch employees", 
        message: errorMessage,
        details: isConnectionError 
          ? "Please check: 1) MySQL server is running, 2) Database credentials are correct, 3) Database 'desi_drop_beta' exists"
          : undefined
      });
    }
  });

  // Update a single order field (optimized for inline editing)
  app.patch("/api/employee_local/:id/field", async (req, res) => {
    try {
      const { id } = req.params; // Format: "order_id-index"
      const { field, value } = req.body;
      
      if (!field || value === undefined) {
        return res.status(400).json({ error: "Field and value are required" });
      }

      // Parse the ID to get order_id (format: "order_id-index")
      const orderId = id.split("-")[0];
      
      // Determine which table to update based on the field
      let updateQuery = "";
      let params: any[] = [];

      switch (field) {
        case "first_name":
        case "last_name":
        case "email":
        case "department":
        case "job_title":    
        case "salary":
          // Update customer details - need to get customer_id from order first
          updateQuery = `UPDATE employees_temp SET ${field} = ? WHERE employee_id = ?`;
          params = [value,orderId];
          break;

      
        default:
          return res.status(400).json({ error: `Field '${field}' is not editable` });
      }

      // Execute the update
      await queryMySQL(updateQuery, params);
      
      console.log(`[API] Updated order field: ${field} for order ${orderId}`);

      // Return success response
      res.json({ 
        success: true, 
        message: `Updated ${field} successfully`,
        orderId,
        field,
        value
      });
    } catch (error: any) {
      console.error("[API] Error updating order field:", error);
      res.status(500).json({ 
        error: "Failed to update order", 
        message: error.message || "Database error"
      });
    }
  });


  // Get orders from MySQL database
  app.get("/api/orders", async (req, res) => {
    try {
      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        console.error("[API] DATABASE_URL is not set");
        return res.status(500).json({ 
          error: "Database configuration error", 
          message: "DATABASE_URL environment variable is not set. Please set it to: mysql+mysqlconnector://root:DesiDrop%40123@localhost/desi_drop_beta"
        });
      }

      console.log("[API] Fetching orders from MySQL...");
      
      const query = `
        SELECT 
          tcd.customer_name,
          tcd.customer_contact,
          tto.pk_id as order_id,
          tto.delivery_address as delivery_address,
          tto.total_amount,
          ttod.item_type,
          ttod.item_name
        FROM tbl_trans_order tto
        JOIN tbl_trans_order_details ttod ON ttod.fk_order_id = tto.pk_id
        JOIN tbl_customer_details tcd ON tcd.pk_id = tto.fk_customer_id
        ORDER BY ttod.pk_id DESC
      `;

      const rows = await queryMySQL<any>(query);
      console.log(`[API] Successfully fetched ${rows.length} orders`);

      // Transform to match frontend DataResult format
      const result = {
        primaryKey: "id",
        columns: [
          { 
            id: "order_id", 
            label: "Order ID", 
            type: "number", 
            width: 120, 
            pinned: "left", 
            editable: false 
          },
          { 
            id: "customer_name", 
            label: "Customer Name", 
            type: "string", 
            width: 200, 
            editable: true 
          },
          { 
            id: "customer_contact", 
            label: "Customer Contact", 
            type: "string", 
            width: 150, 
            editable: true 
          },
          { 
            id: "delivery_address", 
            label: "Delivery Address", 
            type: "string", 
            width: 300, 
            editable: true 
          },
          { 
            id: "total_amount", 
            label: "Total Amount", 
            type: "number", 
            width: 140, 
            editable: true 
          },
          { 
            id: "item_type", 
            label: "Item Type", 
            type: "string", 
            width: 150, 
            editable: true 
          },
          { 
            id: "item_name", 
            label: "Item Name", 
            type: "string", 
            width: 250, 
            editable: true 
          },
        ],
        rows: rows.map((row, index) => ({
          id: `${row.order_id}-${index}`, // Create unique ID from order_id and index
          order_id: row.order_id,
          customer_name: row.customer_name || "",
          customer_contact: row.customer_contact || "",
          delivery_address: row.delivery_address || "",
          total_amount: parseFloat(row.total_amount) || 0, // Convert string to number
          item_type: row.item_type || "",
          item_name: row.item_name || "",
        }))
      };
      
      res.json(result);
    } catch (error: any) {
      console.error("[API] Error fetching orders:", error);
      console.error("[API] Error stack:", error.stack);
      
      // Provide more detailed error information
      const errorMessage = error.message || "Database connection error";
      const isConnectionError = errorMessage.includes("ECONNREFUSED") || 
                                errorMessage.includes("ER_ACCESS_DENIED") ||
                                errorMessage.includes("ENOTFOUND") ||
                                errorMessage.includes("ETIMEDOUT");
      
      res.status(500).json({ 
        error: "Failed to fetch orders", 
        message: errorMessage,
        details: isConnectionError 
          ? "Please check: 1) MySQL server is running, 2) Database credentials are correct, 3) Database 'desi_drop_beta' exists"
          : undefined
      });
    }
  });

  // Update a single order field (optimized for inline editing)
  app.patch("/api/orders/:id/field", async (req, res) => {
    try {
      const { id } = req.params; // Format: "order_id-index"
      const { field, value } = req.body;
      
      if (!field || value === undefined) {
        return res.status(400).json({ error: "Field and value are required" });
      }

      // Parse the ID to get order_id (format: "order_id-index")
      const orderId = id.split("-")[0];
      
      // Determine which table to update based on the field
      let updateQuery = "";
      let params: any[] = [];

      switch (field) {
        case "customer_name":
        case "customer_contact":
          // Update customer details - need to get customer_id from order first
          const customerQuery = `SELECT fk_customer_id FROM tbl_trans_order WHERE pk_id = ?`;
          const customerRows = await queryMySQL<any>(customerQuery, [orderId]);
          
          if (!customerRows || customerRows.length === 0) {
            return res.status(404).json({ error: "Order not found" });
          }
          
          const customerId = customerRows[0].fk_customer_id;
          const customerField = field === "customer_name" ? "customer_name" : "customer_contact";
          updateQuery = `UPDATE tbl_customer_details SET ${customerField} = ? WHERE pk_id = ?`;
          params = [value, customerId];
          break;

        case "delivery_address":
        case "total_amount":
          // Update order table
          const orderField = field === "delivery_address" ? "delivery_address" : "total_amount";
          updateQuery = `UPDATE tbl_trans_order SET ${orderField} = ? WHERE pk_id = ?`;
          params = field === "total_amount" ? [parseFloat(value), orderId] : [value, orderId];
          break;

        case "item_type":
        case "item_name":
          // Update order details - need to get the order_detail_id
          // Since we have multiple order details per order, we'll update the first one
          // or we could update all of them. For now, let's update the first one.
          const detailQuery = `SELECT pk_id FROM tbl_trans_order_details WHERE fk_order_id = ? ORDER BY pk_id DESC LIMIT 1`;
          const detailRows = await queryMySQL<any>(detailQuery, [orderId]);
          
          if (!detailRows || detailRows.length === 0) {
            return res.status(404).json({ error: "Order detail not found" });
          }
          
          const detailId = detailRows[0].pk_id;
          const detailField = field === "item_type" ? "item_type" : "item_name";
          updateQuery = `UPDATE tbl_trans_order_details SET ${detailField} = ? WHERE pk_id = ?`;
          params = [value, detailId];
          break;

        default:
          return res.status(400).json({ error: `Field '${field}' is not editable` });
      }

      // Execute the update
      await queryMySQL(updateQuery, params);
      
      console.log(`[API] Updated order field: ${field} for order ${orderId}`);

      // Return success response
      res.json({ 
        success: true, 
        message: `Updated ${field} successfully`,
        orderId,
        field,
        value
      });
    } catch (error: any) {
      console.error("[API] Error updating order field:", error);
      res.status(500).json({ 
        error: "Failed to update order", 
        message: error.message || "Database error"
      });
    }
  });

  // Test database connection endpoint
  app.get("/api/orders/test", async (req, res) => {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ 
          error: "DATABASE_URL not set",
          message: "Please set DATABASE_URL in .env file"
        });
      }

      const { queryMySQL } = await import("./mysql-db");
      await queryMySQL("SELECT 1 as test");
      
      res.json({ 
        success: true, 
        message: "Database connection successful",
        database: process.env.DATABASE_URL.split("/").pop()?.split("?")[0]
      });
    } catch (error: any) {
      console.error("[API] Connection test failed:", error);
      res.status(500).json({ 
        success: false,
        error: "Database connection failed", 
        message: error.message,
        details: {
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState
        }
      });
    }
  });

  return httpServer;
}
