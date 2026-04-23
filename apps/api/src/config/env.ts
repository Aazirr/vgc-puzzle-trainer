export interface ApiEnv {
  port: number;
  nodeEnv: string;
  databaseUrl: string | null;
  corsOrigin: string | null;
}

export function loadApiEnv(): ApiEnv {
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseUrl: process.env.DATABASE_URL ?? null,
    corsOrigin: process.env.CORS_ORIGIN ?? null
  };
}
