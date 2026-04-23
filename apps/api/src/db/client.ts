import { Client } from "pg";

export function createDatabaseClient(connectionString: string) {
  return new Client({ connectionString });
}
