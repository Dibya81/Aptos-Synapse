const assert = require("assert");

class TokenBucket {
  constructor(capacity = 30, fillRatePerSec = 0.5) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.fillRate = fillRatePerSec;
    this.lastRefill = Date.now();
  }

  consume(count = 1) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.fillRate);
    this.lastRefill = now;
  }
}

describe("TokenBucket RateLimiter", () => {
  it("should permit requests within capacity limit", () => {
    const bucket = new TokenBucket(5, 1);
    assert.strictEqual(bucket.consume(1), true);
    assert.strictEqual(bucket.consume(2), true);
  });

  it("should throttle bursts exceeding capacity", () => {
    const bucket = new TokenBucket(2, 0.1);
    assert.strictEqual(bucket.consume(2), true);
    assert.strictEqual(bucket.consume(1), false);
  });
});
