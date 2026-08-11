# Ayúdame MVP

Base desplegable en Vercel para agentes RAG y casos de uso sencillos. Incluye Next.js, Vercel AI SDK, OpenAI/Anthropic, Neon Postgres y pgvector.

## Inicio local
1. `npm install`
2. Copia `.env.example` a `.env.local`
3. Ejecuta `db/schema.sql` en Neon
4. `npm run dev`

## Ingestar conocimiento
`curl -X POST http://localhost:3000/api/ingest -H 'content-type: application/json' -H 'x-admin-secret: change-me' -d '{"agentId":"demo","source":"manual","text":"Contenido del negocio"}'`

## GitHub y Vercel
```bash
git init
git add .
git commit -m "feat: Ayudame MVP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ayudame.git
git push -u origin main
```
Luego importa el repositorio en Vercel, agrega las variables de `.env.example` y despliega.

## Siguiente iteración
- Autenticación y multiempresa
- Carga real de PDF, DOCX, XLSX y rastreo web
- Almacenamiento de archivos
- Límites, facturación, auditoría y evaluaciones RAG
- Widget insertable y WhatsApp
