CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS agents(id text PRIMARY KEY,name text NOT NULL,provider text DEFAULT 'openai',instructions text,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS chunks(id bigserial PRIMARY KEY,agent_id text NOT NULL,content text NOT NULL,metadata jsonb DEFAULT '{}',embedding vector(1536),created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);
