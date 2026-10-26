import { AptosClient } from "@synapse/chain-sdk";
import { logger } from "../utils/logger";

export interface PaymentRequest {
  recipientAddress: string;
  amount: number;
  taskId: number;
  agentName: string;
}

export interface BatchPaymentRequest {
  recipients: Array<{
    address: string;
    amount: number;
    agentName: string;
  }>;
  taskId: number;
}

export class PaymentService {
  private aptosClient: AptosClient;

  constructor(privateKey: string, moduleAddress: string) {
    this.aptosClient = new AptosClient(privateKey, undefined, moduleAddress);
  }

  /**
   * Pay agent for task completion
   */
  async payAgent(payment: PaymentRequest): Promise<string> {
    try {
      logger.info(`Paying agent ${payment.agentName}: ${payment.amount} octas`);

      const txHash = await this.aptosClient.payAgent(
        payment.recipientAddress,
        payment.amount,
        payment.taskId
      );

      logger.info(`Payment sent. TxHash: ${txHash}`);
      return txHash;
    } catch (error) {
      logger.error("Error paying agent:", error);
      throw error;
    }
  }

  /**
   * Pay multiple agents in batch
   */
  async payAgentsBatch(batchPayment: BatchPaymentRequest): Promise<string> {
    try {
      const addresses = batchPayment.recipients.map((r) => r.address);
      const amounts = batchPayment.recipients.map((r) => r.amount);

      logger.info(`Batch paying ${batchPayment.recipients.length} agents`);
      batchPayment.recipients.forEach((r) => {
        logger.info(`  - ${r.agentName}: ${r.amount / 100000000} APT`);
      });

      const txHash = await this.aptosClient.payAgentsBatch(
        addresses,
        amounts,
        batchPayment.taskId
      );

      logger.info(`Batch payment sent. TxHash: ${txHash}`);
      return txHash;
    } catch (error) {
      logger.error("Error in batch payment:", error);
      throw error;
    }
  }

  /**
   * Calculate payment based on quality score
   */
  calculatePayment(qualityScore: number, totalPool: number): number {
    // Payment proportional to quality score
    // Convert to octas (1 APT = 100000000 octas)
    const aptAmount = (qualityScore / 10) * totalPool;
    return Math.floor(aptAmount * 100000000); // Convert to octas
  }

  /**
   * Split payment pool among workers
   */
  calculateSplitPayments(
    scores: { agent: string; score: number }[],
    totalPool: number
  ): Array<{ agent: string; amount: number }> {
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    return scores.map((s) => ({
      agent: s.agent,
      amount: Math.floor(((s.score / totalScore) * totalPool * 100000000)),
    }));
  }

  /**
   * Get total payments made
   */
  async getTotalPayments(): Promise<number> {
    return await this.aptosClient.getTotalPayments();
  }
}