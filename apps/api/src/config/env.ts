export interface ApiEnv {
  port: number;
  nodeEnv: string;
}

export function loadApiEnv(): ApiEnv {
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development"
  };
}
