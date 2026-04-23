import { Client } from "pg";

export type DatabaseClient = Client;

export function createDatabaseClient(connectionString: string) {
  return new Client({ connectionString });
}
