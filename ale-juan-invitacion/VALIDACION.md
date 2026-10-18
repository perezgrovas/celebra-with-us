# Validación de la entrega

Fecha: 11 de octubre de 2026. Entorno: Node.js 24.19.0, npm 11.9.0. La revisión parte del ZIP original, que contenía un prototipo local sin Supabase.

| Verificación                                                     | Resultado                                                   |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Instalación desde `package-lock.json` con `npm ci`               | Correcta                                                    |
| `npm run typecheck`                                              | Correcto, sin errores de TypeScript                         |
| `npm run build`                                                  | Correcto, build de producción de Next.js 16.4.0             |
| `npm test`                                                       | 14 pruebas/subpruebas aprobadas                             |
| `npm run test:e2e`                                               | 6 flujos aprobados sobre build de producción y `next start` |
| Auditoría de dependencias de producción (`npm audit --omit=dev`) | 0 vulnerabilidades reportadas en esta revisión              |

## Base de datos

La migración completa se ejecutó en PostgreSQL embebido mediante PGlite, con roles `anon` y `authenticated`, usuarios de prueba y un esquema de Auth/Storage mínimo. Las pruebas ejercitan SQL real y RLS, no imitaciones en JavaScript de las reglas de negocio.

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

Se inspeccionaron capturas de escritorio, admin móvil e invitación móvil. La prueba de fuentes usa una tipografía sintética incluida solo en `tests/fixtures/`, no en la invitación.

## Pendiente de la infraestructura del titular

No se ha creado un proyecto de Supabase ni un despliegue de Vercel en tu cuenta. No se proporcionaron sus accesos. La conexión está implementada y se activa con la migración y las variables descritas en README.md.

Antes de compartir enlaces definitivos, completa ese setup y valida el mismo flujo en tu proyecto: iniciar sesión, guardar y publicar, crear dos pases, confirmar desde otro dispositivo, volver a abrir la respuesta, subir archivos y asignar una mesa. Verifica también un acceso con otra cuenta para confirmar que no ve los datos de la boda.
