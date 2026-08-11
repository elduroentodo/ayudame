import OpenAI from "openai";
import { sql } from "./db";

export type RetrievedChunk = {
  content: string;
  metadata: Record<string, unknown> | null;
  score: number;
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(text: string) {
  const result = await client.embeddings.create({
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
