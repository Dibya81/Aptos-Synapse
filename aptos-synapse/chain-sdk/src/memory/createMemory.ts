import { AptosClient } from "../client/aptosClient";
import crypto from "crypto";

export interface MemoryContent {
  prompt: string;
  response: string;
  timestamp: number;
  model: string;
}

export class MemoryManager {
  private client: AptosClient;

  constructor(client: AptosClient) {
    this.client = client;
  }

  /**
   * Create a content hash from memory data
   */
  createContentHash(content: MemoryContent): string {
    const contentString = JSON.stringify(content);
    return crypto.createHash("sha256").update(contentString).digest("hex");
  }

  /**
   * Store memory on-chain
   */
  async storeMemory(content: MemoryContent): Promise<{
    txHash: string;
    contentHash: string;
  }> {
    const contentHash = this.createContentHash(content);
    const txHash = await this.client.createMemory(contentHash);

    return {
      txHash,
      contentHash,
    };
  }

  /**
   * Store memory with automatic retry
   */
  async storeMemoryWithRetry(
    content: MemoryContent,
    maxRetries: number = 3
  ): Promise<{
    txHash: string;
    contentHash: string;
  }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.storeMemory(content);
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(
      `Failed to store memory after ${maxRetries} attempts: ${lastError?.message}`
    );
  }
}

