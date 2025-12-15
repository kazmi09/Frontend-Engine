import { type User, type InsertUser, type Employee, type InsertEmployee, type UpdateEmployee, employees } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee CRUD operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: UpdateEmployee): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  bulkCreateEmployees(employeeList: InsertEmployee[]): Promise<Employee[]>;
  updateEmployeeField(id: string, field: string, value: any): Promise<Employee | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { users } = await import("@shared/schema");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { users } = await import("@shared/schema");
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { users } = await import("@shared/schema");
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Employee operations
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return created;
  }

  async updateEmployee(id: string, employeeUpdate: UpdateEmployee): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set({
        ...employeeUpdate,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async bulkCreateEmployees(employeeList: InsertEmployee[]): Promise<Employee[]> {
    if (employeeList.length === 0) return [];
    return await db
      .insert(employees)
      .values(employeeList)
      .returning();
  }

  // Optimized single-field update for inline editing
  async updateEmployeeField(id: string, field: string, value: any): Promise<Employee | undefined> {
    const updateData: any = {
      [field]: value,
      updatedAt: new Date(),
    };
    
    const [updated] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
