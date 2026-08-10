import OpenAI from "openai";import {sql} from "./db";
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
export async function embed(text:string){const r=await client.embeddings.create({model:process.env.OPENAI_EMBEDDING_MODEL||"text-embedding-3-small",input:text});return r.data[0].embedding}
export async function retrieve(agentId:string,query:string){const v=await embed(query);const vector=`[${v.join(",")}]`;const rows=await sql`SELECT content, metadata, 1-(embedding <=> ${vector}::vector) score FROM chunks WHERE agent_id=${agentId} ORDER BY embedding <=> ${vector}::vector LIMIT 5`;return rows}
