import OpenAI from "openai";
import { sql } from "./db";

export type RetrievedChunk = {
  content: string;
  metadata: Record<string, unknown> | null;
  score: number;
};

let client: OpenAI | undefined;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it in Vercel > Settings > Environment Variables."
    );
  }

  client ??= new OpenAI({ apiKey });
  return client;
}

export async function embed(text: string) {
  const result = await getClient().embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    input: text,
  });

  return result.data[0].embedding;
}

export async function retrieve(agentId: string, query: string): Promise<RetrievedChunk[]> {
  const embedding = await embed(query);
  const vector = `[${embedding.join(",")}]`;
  const rows = await sql`
    SELECT content, metadata, 1 - (embedding <=> ${vector}::vector) AS score
    FROM chunks
    WHERE agent_id = ${agentId}
    ORDER BY embedding <=> ${vector}::vector
    LIMIT 5
  `;

  return rows as RetrievedChunk[];
}
