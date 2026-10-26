import { Router } from "express";
import { MemoryController } from "../controllers/memory.controller";

export class MemoryRoutes {
  public router: Router;
  private controller: MemoryController;

  constructor(controller: MemoryController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create memory with AI inference
    this.router.post("/infer", this.controller.inferAndStore.bind(this.controller));

    // Get memory by ID
    this.router.get("/:memoryId", this.controller.getMemory.bind(this.controller));

    // Report task result
    this.router.post("/:memoryId/result", this.controller.reportTaskResult.bind(this.controller));

    // Get agent stats
    this.router.get("/agent/:address/stats", this.controller.getAgentStats.bind(this.controller));

    // Register agent
    this.router.post("/agent/register", this.controller.registerAgent.bind(this.controller));

    // Health check
    this.router.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: Date.now() });
    });
  }
}