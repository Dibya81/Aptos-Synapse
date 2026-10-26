# Changelog

All notable changes to **Aptos Synapse** are documented in this file.

## [2.0.0] - 2026-10-26 (Production Release)

### Added
- Multi-Agent AI Swarm orchestration pipeline with Llama 3, Gemma 2B, and Mistral models.
- On-chain Aptos Move smart contracts (`task_escrow` and `agent_registry`) deployed to Testnet.
- Anti-Prompt Injection firewall middleware with delimiter isolation and heuristic scanners.
- Playwright automated browser test suite capturing 5 high-resolution viewport states.
- Cyberpunk Terminal HUD with real-time SSE execution logs, matrix scramble text, and audio cues.
- Canonical clean architecture diagram with 5-tier layer specification.

### Fixed
- Fixed Node.js Express server crash on transient Aptos RPC connection timeouts.
- Resolved CORS header handling for local developer tooling and Web3 wallet extensions.
- Fixed token bucket rate limiter burst reset bug on sliding window boundaries.

### Security
- Hardened Ed25519 authentication with 300-second timestamp freshness window.
- Isolated agent sub-task payloads into distinct XML/markdown delimiter tags.
