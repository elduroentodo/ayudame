import { neon } from "@neondatabase/serverless";

let sqlClient: ReturnType<typeof neon> | undefined;

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL no esta configurada. Agregala en Vercel > Settings > Environment Variables."
    );
  }

  sqlClient ??= neon(databaseUrl);
  return sqlClient;
}
