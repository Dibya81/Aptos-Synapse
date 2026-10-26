import { AptosClient } from "../client/aptosClient";
export declare class ReputationManager {
    private client;
    constructor(client: AptosClient);
    /**
     * Report a successful task
     */
    reportSuccess(memoryId: number): Promise<string>;
    /**
     * Report a failed task
     */
    reportFailure(memoryId: number): Promise<string>;
    /**
     * Get agent reputation score
     */
    getAgentReputation(agentAddress?: string): Promise<number>;
    /**
     * Get agent statistics
     */
    getAgentStats(agentAddress?: string): Promise<{
        isRegistered: boolean;
        reputation: number;
        totalTasks: number;
    }>;
    /**
     * Calculate success rate
     */
    getSuccessRate(agentAddress?: string): Promise<number>;
}
//# sourceMappingURL=score.d.ts.map