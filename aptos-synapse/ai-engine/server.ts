import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AptosClient } from "../chain-sdk/src/client/aptosClient";
import { MemoryAgent } from "./agents/memory_agent";
import { MemoryEncoder } from "./pipelines/encode_memory";
import { OnChainRanker } from "./retrieval/on_chain_ranker";

dotenv.config();

const app = express();
const PORT = process.env.AI_ENGINE_PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize services
const privateKey = process.env.APTOS_PRIVATE_KEY!;
const moduleAddress = process.env.MODULE_ADDRESS!;
const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

if (!privateKey || !moduleAddress) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const aptosClient = new AptosClient(privateKey, undefined, moduleAddress);
const memoryAgent = new MemoryAgent(ollamaUrl, aptosClient);
const memoryEncoder = new MemoryEncoder();
const onChainRanker = new OnChainRanker(aptosClient);

// Routes

/**
 * Execute AI task and store on blockchain
 */
app.post("/api/agent/execute", async (req, res) => {
  try {
    const { prompt, context, model } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const result = await memoryAgent.executeTask({
      prompt,
      context,
      model,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error executing task:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Chat interface
 */
app.post("/api/agent/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const result = await memoryAgent.chat(message, history);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Encode text into memory representation
 */
app.post("/api/encode", async (req, res) => {
  try {
    const { text, model } = req.body;

    if (!text) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    const encoded = memoryEncoder.encodeText(text, model || "deepseek-r1:8b");

    res.json({
      success: true,
      data: encoded,
    });
  } catch (error) {
    console.error("Error encoding memory:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Rank memories by on-chain score
 */
app.post("/api/rank", async (req, res) => {
  try {
    const { memoryIds, topN } = req.body;

    if (!memoryIds || !Array.isArray(memoryIds)) {
      res.status(400).json({ error: "Valid memoryIds array is required" });
      return;
    }

    const ranked = topN
      ? await onChainRanker.getTopMemories(memoryIds, topN)
      : await onChainRanker.rankMemories(memoryIds);

    res.json({
      success: true,
      data: ranked,
    });
  } catch (error) {
    console.error("Error ranking memories:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Rank by quality score
 */
app.post("/api/rank/quality", async (req, res) => {
  try {
    const { memoryIds } = req.body;

    if (!memoryIds || !Array.isArray(memoryIds)) {
      res.status(400).json({ error: "Valid memoryIds array is required" });
      return;
    }

    const ranked = await onChainRanker.rankByQuality(memoryIds);

    res.json({
      success: true,
      data: ranked,
    });
  } catch (error) {
    console.error("Error ranking by quality:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    ollama: ollamaUrl,
    moduleAddress,
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Engine listening on port ${PORT}`);
  console.log(`📡 Ollama URL: ${ollamaUrl}`);
  console.log(`⛓️  Module Address: ${moduleAddress}`);
});