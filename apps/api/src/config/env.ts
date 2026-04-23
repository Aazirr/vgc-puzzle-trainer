export interface ApiEnv {
  port: number;
  nodeEnv: string;
  databaseUrl: string | null;
  corsOrigins: string[];
}

export function loadApiEnv(): ApiEnv {
  const corsOrigins = (process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseUrl: process.env.DATABASE_URL ?? null,
    corsOrigins
  };
}
