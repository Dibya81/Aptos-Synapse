import { AptosClient } from "../../chain-sdk/src/client/aptosClient";

export interface RankedMemory {
  memoryId: number;
  score: number;
  successCount: number;
  failureCount: number;
  owner: string;
  rank: number;
}

export class OnChainRanker {
  private aptosClient: AptosClient;

  constructor(aptosClient: AptosClient) {
    this.aptosClient = aptosClient;
  }

  /**
   * Rank memories by their on-chain scores
   */
  async rankMemories(memoryIds: number[]): Promise<RankedMemory[]> {
    const memories: RankedMemory[] = [];

    // Fetch all memories
    for (const memoryId of memoryIds) {
      const memory = await this.aptosClient.getMemory(memoryId);

      if (memory.exists) {
        memories.push({
          memoryId,
          score: memory.score,
          successCount: memory.successCount,
          failureCount: memory.failureCount,
          owner: memory.owner,
          rank: 0, // Will be set after sorting
        });
      }
    }

    // Sort by score (descending)
    memories.sort((a, b) => b.score - a.score);

    // Assign ranks
    memories.forEach((memory, index) => {
      memory.rank = index + 1;
    });

    return memories;
  }

  /**
   * Get top N memories by score
   */
  async getTopMemories(memoryIds: number[], topN: number = 10): Promise<RankedMemory[]> {
    const ranked = await this.rankMemories(memoryIds);
    return ranked.slice(0, topN);
  }

  /**
   * Calculate memory quality score
   * Combines on-chain score with success rate
   */
  calculateQualityScore(memory: RankedMemory): number {
    const totalTasks = memory.successCount + memory.failureCount;
    
    if (totalTasks === 0) {
      return memory.score;
    }

    const successRate = memory.successCount / totalTasks;
    
    // Weight: 70% on-chain score, 30% success rate
    return memory.score * 0.7 + successRate * 100 * 0.3;
  }

  /**
   * Rank memories by quality score
   */
  async rankByQuality(memoryIds: number[]): Promise<RankedMemory[]> {
    const ranked = await this.rankMemories(memoryIds);

    // Re-sort by quality score
    ranked.sort((a, b) => {
      const scoreA = this.calculateQualityScore(a);
      const scoreB = this.calculateQualityScore(b);
      return scoreB - scoreA;
    });

    // Update ranks
    ranked.forEach((memory, index) => {
      memory.rank = index + 1;
    });

    return ranked;
  }
}