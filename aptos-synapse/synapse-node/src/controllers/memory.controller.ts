import { Request, Response } from "express";
import { MemoryService } from "../services/memory.service";
import { logger } from "../utils/logger";

export class MemoryController {
  private memoryService: MemoryService;

  constructor(memoryService: MemoryService) {
    this.memoryService = memoryService;
  }

  /**
   * Infer with AI and store on blockchain
   */
  async inferAndStore(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, model } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      logger.info(`Received inference request for prompt: ${prompt.substring(0, 50)}...`);

      const result = await this.memoryService.inferAndStoreMemory(
        prompt,
        model || "deepseek-r1:8b"
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error in inferAndStore:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get memory by ID
   */
  async getMemory(req: Request, res: Response): Promise<void> {
    try {
      const memoryId = parseInt(req.params.memoryId);

      if (isNaN(memoryId)) {
        res.status(400).json({ error: "Invalid memory ID" });
        return;
      }

      const memory = await this.memoryService.getMemory(memoryId);

      if (!memory.exists) {
        res.status(404).json({ error: "Memory not found" });
        return;
      }

      res.json({
        success: true,
        data: memory,
      });
    } catch (error) {
      logger.error("Error in getMemory:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Report task result (success/failure)
   */
  async reportTaskResult(req: Request, res: Response): Promise<void> {
    try {
      const memoryId = parseInt(req.params.memoryId);
      const { isSuccess } = req.body;

      if (isNaN(memoryId) || typeof isSuccess !== "boolean") {
        res.status(400).json({ error: "Invalid parameters" });
        return;
      }

      const txHash = await this.memoryService.reportTaskResult(memoryId, isSuccess);

      res.json({
        success: true,
        data: {
          txHash,
          memoryId,
          isSuccess,
        },
      });
    } catch (error) {
      logger.error("Error in reportTaskResult:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      const stats = await this.memoryService.getAgentStats(address);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error in getAgentStats:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Register agent
   */
  async registerAgent(req: Request, res: Response): Promise<void> {
    try {
      const txHash = await this.memoryService.registerAgent();

      res.json({
        success: true,
        data: {
          txHash,
          message: "Agent registered successfully",
        },
      });
    } catch (error) {
      logger.error("Error in registerAgent:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
