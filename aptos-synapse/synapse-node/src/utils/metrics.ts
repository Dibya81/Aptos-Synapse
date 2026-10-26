export class SwarmMetrics {
  private static totalRequests = 0;
  private static totalErrors = 0;
  private static latencyHistogram: number[] = [];

  static recordRequest(latencyMs: number, isError = false) {
    this.totalRequests++;
    if (isError) this.totalErrors++;
    this.latencyHistogram.push(latencyMs);
    if (this.latencyHistogram.length > 500) {
      this.latencyHistogram.shift();
    }
  }

  static getSummary() {
    const avgLatency = this.latencyHistogram.length > 0
      ? this.latencyHistogram.reduce((a, b) => a + b, 0) / this.latencyHistogram.length
      : 0;
    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      averageLatencyMs: Math.round(avgLatency),
      p95LatencyMs: this.getPercentile(95)
    };
  }

  private static getPercentile(pct: number): number {
    if (this.latencyHistogram.length === 0) return 0;
    const sorted = [...this.latencyHistogram].sort((a, b) => a - b);
    const idx = Math.floor((pct / 100) * sorted.length);
    return sorted[Math.min(idx, sorted.length - 1)];
  }
}
