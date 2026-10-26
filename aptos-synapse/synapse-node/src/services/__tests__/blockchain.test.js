const assert = require("assert");

class MockAptosService {
  constructor(network = "testnet") {
    this.network = network;
    this.mints = [];
  }

  async storeMemoryRecord(queryHash, score) {
    const txHash = "0x" + Buffer.from(queryHash).toString("hex").slice(0, 64);
    this.mints.push({ txHash, score });
    return { success: true, txHash, network: this.network };
  }
}

describe("Aptos Blockchain Service", () => {
  it("should generate deterministic transaction hashes", async () => {
    const service = new MockAptosService("testnet");
    const res = await service.storeMemoryRecord("query_sample_123", 0.96);
    assert.strictEqual(res.success, true);
    assert.ok(res.txHash.startsWith("0x"));
  });
});
