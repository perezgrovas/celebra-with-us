# Validación de la entrega

Fecha: 18 de octubre de 2026. Entrega 3.0: editor visual sobre la aplicación existente. Entorno: Node.js 24, npm 11.

| Verificación                                       | Resultado                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Instalación desde `package-lock.json` con `npm ci` | Correcta                                                                                                                        |
| `npm run typecheck`                                | Correcto, sin errores de TypeScript                                                                                             |
| `npm run build`                                    | Correcto, build de producción de Next.js 16.4.0                                                                                 |
| `npm test`                                         | 20 pruebas/subpruebas aprobadas                                                                                                 |
| `npm run test:e2e`                                 | 10 flujos aprobados sobre build de producción y `next start`                                                                    |
| Dependencias de producción                         | Sin cambios respecto a la entrega anterior; la auditoría previa reportó 0 vulnerabilidades, no se repitió en esta actualización |

## Base de datos

Las migraciones 001 y 002 se ejecutaron; 002 se repitió para comprobar que admite reejecución. El SQL se ejecutó en PostgreSQL embebido mediante PGlite, con roles `anon` y `authenticated`, usuarios de prueba y un esquema de Auth/Storage mínimo. Las pruebas ejercitan SQL real y RLS, no imitaciones en JavaScript de las reglas de negocio.

Se verificó:

- Sin publicación, la lectura pública devuelve null.
- Un propietario ajeno no puede leer invitados/configuración ni guardar esa boda.
- El público no puede consultar directamente las tablas de invitados o bodas.
- Cada token recupera únicamente sus propios pases.
- RSVP rechaza pases ajenos, duplicados, respuestas incompletas y estados inválidos.
- Un fallo de validación revierte toda la respuesta; un envío válido persiste.
- Un grupo no puede enviar de nuevo dentro de tres segundos.
- No se pueden exceder capacidades ni asignar mesas de otra boda.
- Guardar un borrador no cambia la versión publicada.
- Una versión desactualizada no puede sobrescribir una versión nueva.
- Se aplica el plazo de confirmación y la opción que impide corregir respuestas.
- Storage restringe subidas por propietario y conserva objetos que ya tienen un asset registrado.
- Las fotos deben pertenecer a la boda; el payload público incluye únicamente assets usados por la publicación, incluidas sus fuentes personalizadas.
- Retirar la publicación revoca la lectura por token.
- Las funciones de guardar/retirar devuelven un objeto JSON explícito para conservar el contrato de la API a través de PostgREST.

PGlite no comprueba carreras entre varias conexiones, ni opera los servicios administrados de Supabase. Las reglas de Storage se ejercitan contra tablas de prueba compatibles con el contrato; la subida real de bytes a Supabase no se ha realizado.

## Navegador

Chromium, escritorio 1440 × 1000 y celular 390 × 844. Backend HTTP simulado para Auth, RPC y Storage; cada flujo comienza con datos de prueba limpios. No se escriben datos en tu proyecto real.

1. Inicio de sesión, edición de nombres, guardado, recarga, orden real de secciones y creación de invitación grupal.
2. Navegación del admin desde celular, colores/fuentes y vista previa accesible, sin desbordamiento horizontal.
3. Invitación personalizada desde celular: confirmar/declinar pases, persistencia al recargar y ausencia de errores de hidratación.
4. Enlace inválido: estado 404 con mensaje útil.
5. Subida de foto, fondo y fuente personalizada; selección en galería/diseño, guardado y persistencia al recargar.
6. Creación de mesa, asignación de invitado confirmado y persistencia al recargar desde celular.

7. Acomodos, texto libre, doodles arrastrables y posición móvil independiente; guardar, recargar y publicar.
8. Paletas predeterminadas/personalizadas, categorías de doodles y deshacer/rehacer.
9. Video opcional, ocultar secciones y vista del invitado desde celular.
10. Carga real de las 48 fuentes locales en FontFace, máscaras, carrusel y restablecimiento del fondo.

Se inspeccionaron capturas de escritorio y móvil. Las pruebas unitarias verifican licencias y hashes de los archivos de fuentes. La fuente sintética de `tests/fixtures/` solo sirve para probar la subida de archivos propios.

## Despliegue existente

Tu sitio de Vercel y proyecto de Supabase ya existen. Esta actualización se validó localmente con SQL real embebido y servicios HTTP simulados; no se modificó tu base de datos ni se desplegó en tu cuenta. Sigue ACTUALIZAR.md: ejecutar únicamente 002 en el proyecto existente y actualizar el código del repositorio.

Después del despliegue, comprueba iniciar sesión, guardar/publicar un cambio visual, subir una foto y confirmar una invitación desde otro dispositivo. No se probó esta actualización contra tus credenciales o datos reales.
