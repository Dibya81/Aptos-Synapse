# Agent Swarm Protocol Specification

## Message Structure

All inter-agent communication within the Synapse Swarm follows the canonical envelope format:

```json
{
  "protocol_version": "1.0",
  "task_id": "uuid-v4",
  "sender_agent_id": "0x0ef9...fc65",
  "recipient_agent_id": "0xe4b5...766d",
  "role": "WORKER_LOGIC",
  "payload": {
    "sub_task": "Synthesize security vulnerabilities",
    "context": "...",
    "constraints": ["deterministic_syntax", "json_only"]
  },
  "timestamp_ms": 1729953600000
}
```

## Consensus & Quality Verification
1. Lead Orchestrator shards task into independent work units.
2. Workers execute in parallel via Ollama instances.
3. Neural evaluator benchmarks outputs on factual consistency, coherence, and safety.
4. Output payload is hashed and signed before on-chain commit.
