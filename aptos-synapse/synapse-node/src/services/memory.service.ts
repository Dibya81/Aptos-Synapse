import { AptosClient, MemoryManager, MemoryContent, ReputationManager } from "@synapse/chain-sdk";
import axios from "axios";
import { logger } from "../utils/logger";

export interface InferenceResult {
  prompt: string;
  response: string;
  model: string;
  timestamp: number;
  txHash: string;
  contentHash: string;
}

export class MemoryService {
  private aptosClient: AptosClient;
  private memoryManager: MemoryManager;
  private reputationManager: ReputationManager;
  private ollamaUrl: string;

  constructor(
    privateKey: string,
    moduleAddress: string,
    ollamaUrl: string = "http://localhost:11434"
  ) {
    this.aptosClient = new AptosClient(privateKey, undefined, moduleAddress);
    this.memoryManager = new MemoryManager(this.aptosClient);
    this.reputationManager = new ReputationManager(this.aptosClient);
    this.ollamaUrl = ollamaUrl;
  }

  /**
   * Call Ollama API for inference
   */
  async callOllama(prompt: string, model: string): Promise<string> {
    try {
      logger.info(`Calling Ollama with model: ${model}`);
      
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false,
        },
        {
          timeout: 500000, // 2 minutes timeout
        }
      );

      return response.data.response;
    } catch (error) {
      logger.error("Ollama API error:", error);
      throw new Error(`Failed to get response from Ollama: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Infer with AI and store on blockchain
   */
  async inferAndStoreMemory(prompt: string, model: string): Promise<InferenceResult> {
    try {
      // Step 1: Get AI response
      logger.info("Getting AI response...");
      const aiResponse = await this.callOllama(prompt, model);
      logger.info(`AI response received (${aiResponse.length} chars)`);

      // Step 2: Create memory content
      const memoryContent: MemoryContent = {
        prompt,
        response: aiResponse,
        timestamp: Date.now(),
        model,
      };

      // Step 3: Store on blockchain
      let txHash = "TRANSACTION_NOT_COMMITTED_ON_CHAIN";
      let contentHash = "";
      let onChainError: string | undefined = undefined;

      try {
        logger.info("Storing memory on blockchain...");
        const result = await this.memoryManager.storeMemoryWithRetry(memoryContent, 1);
        txHash = result.txHash;
        contentHash = result.contentHash;
        logger.info(`Memory stored successfully on Aptos. TxHash: ${txHash}`);
      } catch (chainErr: any) {
        logger.warn(`On-chain transaction execution failed: ${chainErr.message}`);
        onChainError = chainErr.message;
        txHash = chainErr.message?.includes("module_not_found")
          ? "TRANSACTION_FAILED: ModuleNotPublishedOnTestnet"
          : `TRANSACTION_FAILED: ${chainErr.message?.substring(0, 60)}`;
      }

      return {
        prompt,
        response: aiResponse,
        model,
        timestamp: memoryContent.timestamp,
        txHash,
        contentHash,
        onChainError,
      };
    } catch (error) {
      logger.error("Error in inferAndStoreMemory:", error);
      throw error;
    }
  }

  /**
   * Get memory from blockchain
   */
  async getMemory(memoryId: number) {
    return await this.aptosClient.getMemory(memoryId);
  }

  /**
   * Report task result
   */
  async reportTaskResult(memoryId: number, isSuccess: boolean): Promise<string> {
    if (isSuccess) {
      return await this.reputationManager.reportSuccess(memoryId);
    } else {
      return await this.reputationManager.reportFailure(memoryId);
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(address?: string) {
    return await this.reputationManager.getAgentStats(address);
  }

  /**
   * Register agent
   */
  async registerAgent(): Promise<string> {
    return await this.aptosClient.registerAgent();
  }
}