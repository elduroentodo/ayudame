import OpenAI from "openai";
import { getSql } from "./db";

export type RetrievedChunk = {
  content: string;
  metadata: Record<string, unknown> | null;
  score: number;
};

let openAIClient: OpenAI | undefined;

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no esta configurada. Agregala en Vercel > Settings > Environment Variables.");
  }
  openAIClient ??= new OpenAI({ apiKey });
  return openAIClient;
}

export async function embed(text: string) {
  const response = await getOpenAI().embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function retrieve(agentId: string, query: string): Promise<RetrievedChunk[]> {
  const sql = getSql();
  const embedding = await embed(query);
  const vector = `[${embedding.join(",")}]`;
  const rows = await sql`
    SELECT content, metadata,
           1 - (embedding <=> ${vector}::vector) AS score
    FROM chunks
    WHERE agent_id = ${agentId}
    ORDER BY embedding <=> ${vector}::vector
    LIMIT 5
  `;
  return rows as RetrievedChunk[];
}
