export interface ApiEnv {
  port: number;
  nodeEnv: string;
  databaseUrl: string | null;
}

export function loadApiEnv(): ApiEnv {
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseUrl: process.env.DATABASE_URL ?? null
  };
}
