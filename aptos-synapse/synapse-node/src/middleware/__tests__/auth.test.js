const assert = require("assert");

function verifyTimestamp(timestampMs, maxAgeMs = 300000) {
  const now = Date.now();
  return Math.abs(now - timestampMs) <= maxAgeMs;
}

describe("Ed25519 Auth Middleware", () => {
  it("should accept valid fresh timestamps", () => {
    const now = Date.now();
    assert.strictEqual(verifyTimestamp(now), true);
    assert.strictEqual(verifyTimestamp(now - 10000), true);
  });

  it("should reject expired or replay timestamps", () => {
    const expired = Date.now() - 400000;
    assert.strictEqual(verifyTimestamp(expired), false);
  });
});
