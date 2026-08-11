import { embed } from "@/lib/rag";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function chunks(text: string, size = 900, overlap = 120) {
  const output: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    output.push(text.slice(i, i + size));
  }
  return output;
}

export async function POST(req: Request) {
  try {
    if (req.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { agentId, text, source = "manual" } = await req.json();
    if (!agentId || !text) {
      return Response.json({ error: "Faltan agentId o text" }, { status: 400 });
    }

    const sql = getSql();
    let count = 0;

    for (const content of chunks(text)) {
      const embedding = await embed(content);
      const vector = `[${embedding.join(",")}]`;
      await sql`
        INSERT INTO chunks(agent_id, content, metadata, embedding)
        VALUES (
          ${agentId},
          ${content},
          ${JSON.stringify({ source })}::jsonb,
          ${vector}::vector
        )
      `;
      count++;
    }

    return Response.json({ ok: true, chunks: count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
