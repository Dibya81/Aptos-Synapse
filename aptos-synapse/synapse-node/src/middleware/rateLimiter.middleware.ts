import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * In-memory sliding-window rate limiter middleware
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const tracker = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetAt) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const record = tracker.get(ip);

    if (!record || now > record.resetAt) {
      tracker.set(ip, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.maxRequests) {
      logger.warn(`Rate limit exceeded for IP ${ip} on ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        error: options.message || "Too many requests. Please try again later.",
        retryAfterMs: Math.max(0, record.resetAt - now),
      });
      return;
    }

    record.count++;
    return next();
  };
}
