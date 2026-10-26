const assert = require("assert");

function calculateQualityScore(metrics) {
  const { coherence, syntax, depth, safety } = metrics;
  const score = (coherence * 0.35) + (syntax * 0.25) + (depth * 0.25) + (safety * 0.15);
  return Math.min(1.0, Math.max(0.0, score));
}

describe("Neural Quality Evaluator", () => {
  it("should compute composite score correctly", () => {
    const metrics = { coherence: 0.95, syntax: 0.90, depth: 0.88, safety: 1.0 };
    const score = calculateQualityScore(metrics);
    assert.ok(score >= 0.90 && score <= 1.0);
  });

  it("should penalize compromised safety or syntax", () => {
    const metrics = { coherence: 0.80, syntax: 0.20, depth: 0.50, safety: 0.10 };
    const score = calculateQualityScore(metrics);
    assert.ok(score < 0.60);
  });
});
