import crypto from "crypto";

export interface EncodedMemory {
  contentHash: string;
  embedding: number[];
  metadata: {
    timestamp: number;
    model: string;
    tokenCount: number;
  };
}

export class MemoryEncoder {
  /**
   * Encode text into a memory representation
   */
  encodeText(text: string, model: string): EncodedMemory {
    // Create content hash
    const contentHash = crypto.createHash("sha256").update(text).digest("hex");

    // Generate simple embedding (in production, use proper embedding model)
    const embedding = this.generateEmbedding(text);

    // Estimate token count
    const tokenCount = this.estimateTokenCount(text);

    return {
      contentHash,
      embedding,
      metadata: {
        timestamp: Date.now(),
        model,
        tokenCount,
      },
    };
  }

  /**
   * Generate a simple embedding representation
   * In production, use a proper embedding model
   */
  private generateEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0);

    words.forEach((word, idx) => {
      const hash = word.split("").reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0);

      const position = Math.abs(hash) % embedding.length;
      embedding[position] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0));
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Compute cosine similarity between two embeddings
   */
  computeSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have the same length");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }
}