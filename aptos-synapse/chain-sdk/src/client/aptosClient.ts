import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";

export class AptosClient {
  private aptos: Aptos;
  private account: Account;
  private moduleAddress: string;

  constructor(
    privateKey: string,
    networkOrModuleAddress: Network | string = Network.TESTNET,
    moduleAddress?: string
  ) {
    let network = Network.TESTNET;
    let modAddr = moduleAddress;
    if (networkOrModuleAddress) {
      if (
        typeof networkOrModuleAddress === "string" &&
        (networkOrModuleAddress.startsWith("0x") ||
          networkOrModuleAddress.length === 66 ||
          networkOrModuleAddress.length === 64)
      ) {
        modAddr = networkOrModuleAddress;
      } else {
        network = networkOrModuleAddress as Network;
      }
    }
    if (!modAddr && process.env.MODULE_ADDRESS) {
      modAddr = process.env.MODULE_ADDRESS;
    }

    const config = new AptosConfig({ network });
    this.aptos = new Aptos(config);

    const privateKeyObj = new Ed25519PrivateKey(privateKey);
    this.account = Account.fromPrivateKey({ privateKey: privateKeyObj });
    this.moduleAddress = modAddr || "0x945d08981bf39a4f0c72c242c2488c13db6abc0dd302993e02449185dc3fab43";
  }

  getAccount(): Account {
    return this.account;
  }

  getAddress(): string {
    return this.account.accountAddress.toString();
  }

  async getBalance(): Promise<number> {
    const resources = await this.aptos.getAccountCoinsData({
      accountAddress: this.account.accountAddress,
    });
    return resources[0]?.amount || 0;
  }

  async registerAgent(): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: {
        function: `${this.moduleAddress}::memory_registry::register_agent`,
        functionArguments: [],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction,
    });

    const executedTransaction = await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (!executedTransaction.success) {
      throw new Error(`Transaction failed: ${(executedTransaction as any).vm_status || "Execution aborted"}`);
    }

    return executedTransaction.hash;
  }

  async createMemory(contentHash: string): Promise<string> {
    const hashBytes = Buffer.from(contentHash, "hex");

    const transaction = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: {
        function: `${this.moduleAddress}::memory_store::create_memory_v2`,
        functionArguments: [Array.from(hashBytes)],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction,
    });

    const executedTransaction = await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (!executedTransaction.success) {
      throw new Error(`Transaction failed: ${(executedTransaction as any).vm_status || "Execution aborted"}`);
    }

    return executedTransaction.hash;
  }

  async applyTaskResult(memoryId: number, isSuccess: boolean): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: {
        function: `${this.moduleAddress}::memory_reputation::apply_task_result`,
        functionArguments: [memoryId, isSuccess],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction,
    });

    const executedTransaction = await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (!executedTransaction.success) {
      throw new Error(`Transaction failed: ${(executedTransaction as any).vm_status || "Execution aborted"}`);
    }

    return executedTransaction.hash;
  }

  async getAgentStats(agentAddress: string): Promise<{
    isRegistered: boolean;
    reputation: number;
    totalTasks: number;
  }> {
    try {
      const reputation = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::memory_registry::view_agent_reputation`,
          functionArguments: [agentAddress],
        },
      });

      const totalTasks = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::memory_registry::view_agent_tasks`,
          functionArguments: [agentAddress],
        },
      });

      const isRegistered = Number(reputation[0]) > 0 || Number(totalTasks[0]) > 0;

      return {
        isRegistered,
        reputation: Number(reputation[0]),
        totalTasks: Number(totalTasks[0]),
      };
    } catch (error) {
      return {
        isRegistered: false,
        reputation: 0,
        totalTasks: 0,
      };
    }
  }

  async getMemory(memoryId: number): Promise<{
    exists: boolean;
    owner: string;
    score: number;
    successCount: number;
    failureCount: number;
  }> {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::memory_store::view_memory_details`,
          functionArguments: [memoryId],
        },
      });

      return {
        exists: result[0] as boolean,
        owner: "",
        score: Number(result[1]),
        successCount: Number(result[2]),
        failureCount: Number(result[3]),
      };
    } catch (error) {
      return {
        exists: false,
        owner: "",
        score: 0,
        successCount: 0,
        failureCount: 0,
      };
    }
  }

  /**
   * Pay a single agent
   */
  async payAgent(
    recipientAddress: string,
    amount: number,
    taskId: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: {
        function: `${this.moduleAddress}::payment_manager::pay_agent`,
        functionArguments: [recipientAddress, amount, taskId],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction,
    });

    const executedTransaction = await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (!executedTransaction.success) {
      throw new Error(`Payment transaction failed: ${(executedTransaction as any).vm_status || "Execution aborted"}`);
    }

    return executedTransaction.hash;
  }

  /**
   * Pay multiple agents in a batch
   */
  async payAgentsBatch(
    recipients: string[],
    amounts: number[],
    taskId: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: {
        function: `${this.moduleAddress}::payment_manager::pay_agents_batch`,
        functionArguments: [recipients, amounts, taskId],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction,
    });

    const executedTransaction = await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (!executedTransaction.success) {
      throw new Error(`Batch payment transaction failed: ${(executedTransaction as any).vm_status || "Execution aborted"}`);
    }

    return executedTransaction.hash;
  }

  /**
   * Get total payments made
   */
  async getTotalPayments(): Promise<number> {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::payment_manager::get_total_payments`,
          functionArguments: [],
        },
      });

      return Number(result[0]);
    } catch (error) {
      return 0;
    }
  }
}