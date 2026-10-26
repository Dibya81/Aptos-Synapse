export interface AgentIdentity {
  id: string;
  name: string;
  model: string;
  walletAddress: string;
  role: 'orchestrator' | 'worker_logic' | 'worker_systems' | 'custom';
}

export interface SwarmTaskExecutionRequest {
  query: string;
  orchestratorModel?: string;
  workerModels?: string[];
  maxTokens?: number;
  temperature?: number;
  userWallet?: string;
}

export interface WorkerExecutionResult {
  agentId: string;
  model: string;
  role: string;
  executionTimeMs: number;
  output: string;
  qualityScore: number;
}

export interface SwarmExecutionResponse {
  taskId: string;
  orchestratorPlan: string;
  workerResults: WorkerExecutionResult[];
  compositeScore: number;
  blockchainTxHash?: string;
  timestamp: string;
}
