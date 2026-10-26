import { AptosClient } from "../client/aptosClient";
export interface MemoryContent {
    prompt: string;
    response: string;
    timestamp: number;
    model: string;
}
export declare class MemoryManager {
    private client;
    constructor(client: AptosClient);
    /**
     * Create a content hash from memory data
     */
    createContentHash(content: MemoryContent): string;
    /**
     * Store memory on-chain
     */
    storeMemory(content: MemoryContent): Promise<{
        txHash: string;
        contentHash: string;
    }>;
    /**
     * Store memory with automatic retry
     */
    storeMemoryWithRetry(content: MemoryContent, maxRetries?: number): Promise<{
        txHash: string;
        contentHash: string;
    }>;
}
//# sourceMappingURL=createMemory.d.ts.map