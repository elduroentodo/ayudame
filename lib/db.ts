import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;

let client: Sql | undefined;

export function getSql(): Sql {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it in Vercel > Settings > Environment Variables."
    );
  }

  client ??= neon(databaseUrl);
  return client;
}

export const sql = (...args: Parameters<Sql>) => getSql()(...args);
