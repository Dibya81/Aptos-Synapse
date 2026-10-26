export async function checkSystemHealth(ollamaEndpoint = "http://127.0.0.1:11434", aptosRpc = "https://fullnode.testnet.aptoslabs.com/v1") {
  const results = {
    synapseNode: true,
    ollama: false,
    aptosRpc: false,
    timestamp: new Date().toISOString()
  };

  try {
    const ollamaRes = await fetch(`${ollamaEndpoint}/api/tags`);
    results.ollama = ollamaRes.ok;
  } catch {
    results.ollama = false;
  }

  try {
    const aptosRes = await fetch(`${aptosRpc}/`);
    results.aptosRpc = aptosRes.ok;
  } catch {
    results.aptosRpc = false;
  }

  return results;
}
