
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getUserSettings(req.params.sessionId);
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.json(settings);
  });

  app.post(api.settings.save.path, async (req, res) => {
    try {
      const input = api.settings.save.input.parse(req.body);
      const settings = await storage.saveUserSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      throw err;
    }
  });

  return httpServer;
}
