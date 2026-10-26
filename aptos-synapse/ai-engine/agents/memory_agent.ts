import axios from "axios";
import { AptosClient } from "../../chain-sdk/src/client/aptosClient";
import { MemoryManager, MemoryContent } from "../../chain-sdk/src/memory/createMemory";

export interface AgentTask {
  prompt: string;
  context?: string;
  model?: string;
}

export interface AgentResponse {
  response: string;
  reasoning?: string;
  contentHash: string;
  txHash: string;
  timestamp: number;
}

export class MemoryAgent {
  private ollamaUrl: string;
  private aptosClient: AptosClient;
  private memoryManager: MemoryManager;
  private defaultModel: string;

  constructor(
    ollamaUrl: string,
    aptosClient: AptosClient,
    defaultModel: string = "deepseek-r1:8b"
  ) {
    this.ollamaUrl = ollamaUrl;
    this.aptosClient = aptosClient;
    this.memoryManager = new MemoryManager(aptosClient);
    this.defaultModel = defaultModel;
  }

  /**
   * Execute a task with AI reasoning and store on blockchain
   */
  async executeTask(task: AgentTask): Promise<AgentResponse> {
    const model = task.model || this.defaultModel;

    // Build the full prompt with context
    const fullPrompt = task.context
      ? `Context: ${task.context}\n\nTask: ${task.prompt}`
      : task.prompt;

    // Get AI response
    const response = await this.inferWithOllama(fullPrompt, model);

    // Create memory content
    const memoryContent: MemoryContent = {
      prompt: task.prompt,
      response,
      timestamp: Date.now(),
      model,
    };

    // Store on blockchain
    const { txHash, contentHash } = await this.memoryManager.storeMemoryWithRetry(
      memoryContent,
      3
    );

    return {
      response,
      contentHash,
      txHash,
      timestamp: memoryContent.timestamp,
    };
  }

  /**
   * Call Ollama for inference
   */
  private async inferWithOllama(prompt: string, model: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false,
        },
        {
          timeout: 12000000,
        }
      );

      return response.data.response;
    } catch (error) {
      throw new Error(`Ollama inference failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Chat interface with memory storage
   */
  async chat(message: string, conversationHistory?: string[]): Promise<AgentResponse> {
    const context = conversationHistory?.join("\n") || "";
    
    return await this.executeTask({
      prompt: message,
      context,
    });
  }

  /**
   * Encode memory with embeddings (placeholder for future vector DB integration)
   */
  async encodeMemory(text: string): Promise<number[]> {
    // This is a placeholder - in production, you'd use an embedding model
    // For now, we'll just return a simple hash-based representation
    const hash = text.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);

    return [hash];
  }
}
