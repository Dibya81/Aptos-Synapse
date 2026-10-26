import { Network, Account } from "@aptos-labs/ts-sdk";
export declare class AptosClient {
    private aptos;
    private account;
    private moduleAddress;
    constructor(privateKey: string, network: Network | undefined, moduleAddress: string);
    getAccount(): Account;
    getAddress(): string;
    getBalance(): Promise<number>;
    registerAgent(): Promise<string>;
    createMemory(contentHash: string): Promise<string>;
    applyTaskResult(memoryId: number, isSuccess: boolean): Promise<string>;
    getAgentStats(agentAddress: string): Promise<{
        isRegistered: boolean;
        reputation: number;
        totalTasks: number;
    }>;
    getMemory(memoryId: number): Promise<{
        exists: boolean;
        owner: string;
        score: number;
        successCount: number;
        failureCount: number;
    }>;
    /**
     * Pay a single agent
     */
    payAgent(recipientAddress: string, amount: number, taskId: number): Promise<string>;
    /**
     * Pay multiple agents in a batch
     */
    payAgentsBatch(recipients: string[], amounts: number[], taskId: number): Promise<string>;
    /**
     * Get total payments made
     */
    getTotalPayments(): Promise<number>;
}
//# sourceMappingURL=aptosClient.d.ts.map