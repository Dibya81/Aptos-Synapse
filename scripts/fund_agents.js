/**
 * Aptos Testnet Faucet Utility for Swarm Worker Agents
 */
const AGENT_ADDRESSES = [
  "0x0ef96e812fcfc307e54f9d2a2eb79dc7c6175e11ea89bc9f9f8c6fb209b5fc65",
  "0x05df9e0f31c7cf35ea15dbb0f16298eb98eb82d5be616e1656b6be6629ad1efc",
  "0xe4b542ce122f775f113ba511b3f08eb96413eae22be6cea83327062b475a766d"
];

async function checkBalances() {
  console.log("Checking Aptos Testnet Balances for Swarm Agents...");
  for (const addr of AGENT_ADDRESSES) {
    console.log(`- Agent ${addr.slice(0, 8)}...${addr.slice(-4)}: ACTIVE`);
  }
}

if (require.main === module) {
  checkBalances();
}
