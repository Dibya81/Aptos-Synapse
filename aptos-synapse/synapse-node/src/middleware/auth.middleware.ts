import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Authentication and authorization middleware for privileged API endpoints
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env.SYNAPSE_API_KEY;

  // If no API key is set in environment, allow local dev calls from localhost
  if (!apiKey) {
    const origin = req.headers.origin || "";
    const isLocal =
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      !origin || // direct server-to-server or tests
      req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.ip === "::ffff:127.0.0.1";

    if (isLocal) {
      return next();
    }
  }

  const providedKey =
    req.headers["x-api-key"] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!providedKey || providedKey !== apiKey) {
    logger.warn(`Unauthorized API access attempt to ${req.originalUrl} from IP ${req.ip}`);
    res.status(401).json({
      success: false,
      error: "Unauthorized: Valid API key required.",
    });
    return;
  }

  next();
}

/**
 * Strict authorization for direct blockchain payment transfers
 */
export function requirePaymentAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_API_KEY || process.env.SYNAPSE_API_KEY;

  if (adminKey) {
    const providedKey =
      req.headers["x-api-key"] ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!providedKey || providedKey !== adminKey) {
      logger.warn(`Unauthorized direct payment attempt from IP ${req.ip}`);
      res.status(403).json({
        success: false,
        error: "Forbidden: Direct blockchain payment requires valid admin credentials.",
      });
      return;
    }
  }

  next();
}

/**
 * Validates that an Aptos address belongs to authorized configured agents
 */
export function isAuthorizedAgentAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  const normalized = address.toLowerCase();

  const authorizedAddresses = [
    process.env.AGENT_A_ADDRESS,
    process.env.AGENT_B_ADDRESS,
    process.env.AGENT_C_ADDRESS,
    process.env.AGENT_D_ADDRESS,
    process.env.AGENT_E_ADDRESS,
    process.env.AGENT_F_ADDRESS,
  ]
    .filter((a): a is string => Boolean(a))
    .map((a) => a.toLowerCase());

  return authorizedAddresses.includes(normalized);
}
