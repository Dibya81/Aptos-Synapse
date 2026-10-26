export interface LogContext {
  requestId?: string;
  service?: string;
  method?: string;
  durationMs?: number;
}

export function formatLogEntry(level: string, message: string, ctx?: LogContext) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...ctx
  });
}
