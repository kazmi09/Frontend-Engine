import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Employee records table
export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  joiningDate: text("joining_date").notNull(),
  salary: integer("salary").notNull(),
  lastLogin: timestamp("last_login").notNull().defaultNow(),
  performanceScore: integer("performance_score").notNull(),
  isRemote: boolean("is_remote").notNull().default(false),
  manager: text("manager"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Grid state persistence table (per user)
export const gridStates = pgTable("grid_states", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  gridId: text("grid_id").notNull(),
  state: json("state").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const updateEmployeeSchema = createInsertSchema(employees).partial().omit({
  id: true,
  createdAt: true,
});

export const insertGridStateSchema = createInsertSchema(gridStates).omit({
  id: true,
  updatedAt: true,
});

// Select schemas
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type GridState = typeof gridStates.$inferSelect;
export type InsertGridState = z.infer<typeof insertGridStateSchema>;
