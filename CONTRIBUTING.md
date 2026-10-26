# Contributing to Aptos Synapse

Thank you for your interest in contributing to **Aptos Synapse**! We welcome contributions from blockchain developers, AI engineers, and UI/UX designers.

## Development Workflow

1. **Fork the Repository**: Clone your fork locally.
2. **Create a Feature Branch**: `git checkout -b feat/your-feature-name`
3. **Install Dependencies**:
   ```bash
   cd aptos-synapse/synapse-node && npm install
   cd ../chain-sdk && npm install
   ```
4. **Run Local Environment**:
   - Ensure local Ollama instance is active (`ollama serve`).
   - Start Synapse Node (`node dist/index.js` on port 3001).
   - Serve Frontend (`python3 -m http.server 3002 --directory aptos-synapse/frontend`).
5. **Run Tests**:
   ```bash
   node aptos-synapse/synapse-node/test_suite.js
   ```

## Commit Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New user-facing or protocol features
- `fix:` Bug fixes and security patches
- `docs:` Documentation improvements
- `refactor:` Code restructuring without behavior changes
- `test:` Unit, integration, or E2E tests
- `perf:` Performance optimizations

## Pull Requests

- Keep PRs focused on a single responsibility.
- Include passing test output in PR descriptions.
- Verify Move contracts compile without errors.
