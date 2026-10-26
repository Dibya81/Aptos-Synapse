import { AptosClient } from "../client/aptosClient";

export class ReputationManager {
  private client: AptosClient;

  constructor(client: AptosClient) {
    this.client = client;
  }

  /**
   * Report a successful task
   */
  async reportSuccess(memoryId: number): Promise<string> {
    return await this.client.applyTaskResult(memoryId, true);
  }

  /**
   * Report a failed task
   */
  async reportFailure(memoryId: number): Promise<string> {
    return await this.client.applyTaskResult(memoryId, false);
  }

  /**
   * Get agent reputation score
   */
  async getAgentReputation(agentAddress?: string): Promise<number> {
    const address = agentAddress || this.client.getAddress();
    const stats = await this.client.getAgentStats(address);
    return stats.reputation;
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(agentAddress?: string) {
    const address = agentAddress || this.client.getAddress();
    return await this.client.getAgentStats(address);
  }

  /**
   * Calculate success rate
   */
  async getSuccessRate(agentAddress?: string): Promise<number> {
    const stats = await this.getAgentStats(agentAddress);
    
    if (stats.totalTasks === 0) {
      return 0;
    }

    // Estimate success rate based on reputation
    // Each success gives +5 reputation
    const estimatedSuccesses = Math.floor(stats.reputation / 5);
    return (estimatedSuccesses / stats.totalTasks) * 100;
  }
}