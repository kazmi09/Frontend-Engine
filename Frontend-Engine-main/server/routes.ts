import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerGenericGridRoutes } from './generic-routes'

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register generic grid routes
  registerGenericGridRoutes(app)

  return httpServer;
}
