# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

The Aptos Synapse team takes security with utmost seriousness. If you discover a vulnerability:
1. **Do not disclose publicly via GitHub issues.**
2. Send an encrypted report to `security@aptossynapse.network`.
3. Include detailed steps to reproduce, affected endpoints, and potential exploit vectors.

### Security Response SLAs

- **Triage Assessment**: < 24 hours
- **Critical Vulnerability Patch**: < 48 hours
- **Public Advisory & CVE**: Post verification and fix deployment

### Key Threat Vectors Monitored

- **Prompt Injection & Model Jailbreaking**: Handled by `InputSanitizer` heuristic regex.
- **Cryptographic Replay Attacks**: Nonce and timestamp validation via Ed25519 signer verification.
- **Reentrancy & Escrow Draining**: Prevented via Move resource capabilities and signer-only checks.
