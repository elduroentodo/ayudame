# QA de Ayúdame

## Protocolo
1. Cada cambio pasa por la compilación de producción en GitHub Actions.
2. QA revisa escritorio y móvil en las rutas públicas: `/`, `/precios`, `/checkout`, `/login`, `/reset-password`.
3. QA revisa la plataforma autenticada: `/app`, `/app/conocimiento`, `/app/probar`.
4. Los fallos se registran por prioridad: **P0** bloquea publicación; **P1** debe corregirse antes de anunciar la función; **P2** se programa.

## Auditoría inicial — 12 de agosto de 2026

### Corregido
- [x] Menú público accesible en móvil.
- [x] Navegación móvil dentro de la plataforma.
- [x] Recuperación de contraseña conectada al encabezado público.
- [x] Compilación de producción en CI.

### Pendiente P0 — backend
- [ ] Proteger `/api/ask`: autenticación, pertenencia al negocio y límite de uso en servidor. No aceptar contexto ni nombre del negocio desde el navegador.
- [ ] Ingestar realmente PDFs y enlaces antes de que el asistente los use.

### Pendiente P1
- [ ] Entrega real de formularios de contacto mediante proveedor de correo.
- [ ] Pasarela de pago real y webhooks; hasta entonces usar la etiqueta “Solicitar plan”.
- [ ] No mostrar `/app/probar` antes de resolver autenticación.
- [ ] Onboarding recuperable si la fuente inicial falla después de crear el espacio.

### Pendiente P2
- [ ] Mostrar enlaces en la biblioteca de conocimiento y sus estados de procesamiento.
- [ ] Validar tipo, tamaño y procesamiento de PDFs en servidor.
