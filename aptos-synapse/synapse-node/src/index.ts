import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { MemoryRoutes } from "./api/memory.routes";
import { MemoryController } from "./controllers/memory.controller";
import { MemoryService } from "./services/memory.service";
import { PaymentRoutes } from "./api/payment.routes";
import { PaymentService } from "./services/payment.service";
import { OrchestrationRoutes } from "./api/orchestration.routes";
import { logger } from "./utils/logger";
import { AgentsRoutes } from "./api/agent.routes";
import { restrictiveCors } from "./middleware/cors.middleware";
import { createRateLimiter } from "./middleware/rateLimiter.middleware";

dotenv.config();
dotenv.config({ path: ".env.agents" }); // Load agent configs

const app = express();
const PORT = process.env.PORT || 3001;

// Restrictive CORS
app.use(restrictiveCors());

// Body parsing with limits
app.use(express.json({ limit: "1mb" }));

// Rate limiting for execution endpoints
const executionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  message: "Too many execution requests. Please rate-limit swarm invocations.",
});

// Initialize services
const privateKey = process.env.APTOS_PRIVATE_KEY!;
const moduleAddress = process.env.MODULE_ADDRESS!;
const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

if (!privateKey || !moduleAddress) {
  logger.error("Missing required environment variables: APTOS_PRIVATE_KEY, MODULE_ADDRESS");
  process.exit(1);
}

// Memory service
const memoryService = new MemoryService(privateKey, moduleAddress, ollamaUrl);
const memoryController = new MemoryController(memoryService);
const memoryRoutes = new MemoryRoutes(memoryController);

// Payment service
const paymentService = new PaymentService(privateKey, moduleAddress);
const paymentRoutes = new PaymentRoutes(paymentService);

// Orchestration routes
const orchestrationRoutes = new OrchestrationRoutes(paymentService);
const agentsRoutes = new AgentsRoutes();

// Health check endpoint (Section 8, 11, 19)
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "synapse-node",
    timestamp: new Date().toISOString(),
    network: "testnet",
    moduleAddress,
    ollamaUrl,
    version: "1.0.0",
    features: {
      blockchainMemory: true,
      blockchainPayments: true,
      multiAgentSwarm: true,
      agentRegistry: true,
    },
  });
});

// Root information endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "Synapse Node API",
    version: "1.0.0",
    status: "running",
    healthCheck: "/health",
    docs: "/api/agents",
  });
});

// Mount Routes
app.use("/api/memory", executionLimiter, memoryRoutes.router);
app.use("/api/payment", paymentRoutes.router);
app.use("/api/orchestrate", executionLimiter, orchestrationRoutes.router);
app.use("/api/agents", agentsRoutes.router);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error on ${req.method} ${req.url}:`, err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Synapse Node API listening on port ${PORT}`);
  logger.info(`📡 Ollama URL: ${ollamaUrl}`);
  logger.info(`⛓️  Module Address: ${moduleAddress}`);
  logger.info(`🌐 Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, closing Synapse Node API...");
  server.close(() => {
    logger.info("Synapse Node API closed successfully.");
    process.exit(0);
  });
});

export default app;