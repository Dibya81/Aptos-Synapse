export const ON_CHAIN = {
  address: "0x945d08981bf39a4f0c72c242c2488c13db6abc0dd302993e02449185dc3fab43",
  modules: {
    memoryStore: "0x945d08981bf39a4f0c72c242c2488c13db6abc0dd302993e02449185dc3fab43::memory_store",
    memoryReputation: "0x945d08981bf39a4f0c72c242c2488c13db6abc0dd302993e02449185dc3fab43::memory_reputation",
    memoryRegistry: "0x945d08981bf39a4f0c72c242c2488c13db6abc0dd302993e02449185dc3fab43::memory_registry",
  },
  entryFunctions: {
    createMemory: "memory_store::create_memory_v2",
    updateReputation: "memory_reputation::apply_task_result",
  },
  network: "testnet",
  nodeUrl: "https://api.testnet.aptoslabs.com/v1",
  faucetUrl: "https://faucet.testnet.aptoslabs.com",
};
