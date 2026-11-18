# WhatsApp Cloud API — piloto Ayúdame

El canal usa la API oficial de Meta. Cada mensaje entrante se enruta por `phone_number_id` a un único negocio de Ayúdame y solo lee sus artículos con estado `published`. El asistente comparte las mismas instrucciones y selección de conocimiento que `/api/ask`.

## Estado seguro por defecto

- El webhook no opera si faltan secretos de servidor.
- Cada fila de `whatsapp_channels` nace con `enabled = false`.
- Los clientes del navegador no tienen permisos sobre `whatsapp_channels` ni `whatsapp_webhook_events`; RLS está activado.
- Se valida `X-Hub-Signature-256` antes de leer eventos.
- Solo se procesan textos entrantes del campo `messages`; se ignoran estados y contenido multimedia.
- La tabla de eventos guarda IDs y estados, no el texto ni el teléfono del cliente.
- El mismo `wa_message_id` no genera dos respuestas mientras el envío quede registrado como `sent`; errores transitorios devuelven 503 para que Meta reintente.

## Preparación de Meta

1. Crear o abrir una app en [Meta for Developers](https://developers.facebook.com/apps/) con el producto WhatsApp y asociar un número de prueba.
2. Obtener el App Secret, un token de acceso válido para enviar mensajes y el Phone Number ID. Para un piloto, no usar un token temporal como credencial permanente.
3. Configurar la URL de callback `https://ayudame-three.vercel.app/api/whatsapp/webhook` y suscribirse al campo `messages` de WhatsApp Business Account. El Verify Token se genera para Ayúdame y debe coincidir con la variable de Vercel.
4. Guardar en Vercel, únicamente como secretos de servidor: `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`. `WHATSAPP_GRAPH_API_VERSION` es opcional; el código usa `v27.0` por defecto. Nunca usar prefijo `NEXT_PUBLIC_` para estos secretos.
5. Ejecutar `supabase/migrations/20261118_whatsapp_channels.sql` en el proyecto Supabase de Ayúdame.
6. Vincular el Phone Number ID a un negocio solamente después de verificar la propiedad del número. Crear una fila de `whatsapp_channels` con `enabled = false`. Probar el webhook y una conversación con el número de prueba; activar `enabled = true` solo cuando el dueño autorice respuestas automáticas.

## Límites del piloto

La vinculación es manual; todavía no implementa Embedded Signup ni un token individual por negocio. El token de servidor debe tener acceso únicamente a las cuentas de WhatsApp que se vayan a utilizar. El modelo responde solo mensajes de texto iniciados por el cliente; no envía campañas ni plantillas, y no procesa PDFs o enlaces hasta que exista extracción de contenido. Si falla el envío a Meta, el evento queda marcado como `failed` y el webhook devuelve 503 para que Meta pueda reintentar. El procesamiento ocurre antes del acuse para evitar perder entregas. Aun así, una caída justo después de que Meta acepte el envío y antes de registrar `sent` podría producir una respuesta duplicada; antes de activar números reales o escalar se requiere una cola durable, observabilidad y reconciliación.

Revisar las [tarifas vigentes de Meta](https://business.whatsapp.com/products/platform-pricing) para el país y categoría antes de activar números reales.
