import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Restrictive CORS configuration
 */
export function restrictiveCors() {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : []),
  ];

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    // Requests without origin (like curl, local scripts, server-to-server) are allowed
    if (!origin) {
      return next();
    }

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
      res.setHeader("Access-Control-Allow-Credentials", "true");

      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      return next();
    }

    logger.warn(`CORS rejected origin: ${origin}`);
    res.status(403).json({
      success: false,
      error: `CORS policy violation: origin '${origin}' is not allowed`,
    });
  };
}
