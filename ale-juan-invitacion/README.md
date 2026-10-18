# Celebra with Us — editor visual de invitaciones

**Si ya tienes la página publicada, empieza por `ACTUALIZAR.md`. Ejecuta únicamente `002_visual_editor.sql` sobre tu proyecto existente.**

Versión 3: editor visual con seis acomodos, texto libre, doodles, máscaras, encuadre, carrusel, video, vistas móvil/escritorio, 48 fuentes locales y paletas personalizadas.

Proyecto refactorizado en Next.js 16, React 19 y TypeScript, preparado para desplegar en Vercel y conectar con Supabase. La configuración y los datos ya no dependen de `localStorage`; el navegador conserva únicamente la sesión de Supabase Auth. **Necesitas crear/configurar tu proyecto de Supabase y las variables de Vercel antes de usar los flujos reales.** No se incluyen credenciales, ni se ha creado un despliegue en tu cuenta.

## 1. Preparar Supabase (una sola vez)

1. Crea un **proyecto nuevo** en [Supabase](https://supabase.com/dashboard). Esta migración instala un esquema limpio; no la ejecutes sobre tablas de una versión anterior con los mismos nombres. El ZIP original era un prototipo local, sin base de datos ni lista de invitados incluida. Si tienes datos de otra versión, respáldalos e impórtalos por separado; no se eliminan ni se migran automáticamente.
2. Abre **SQL Editor → New query**, pega todo `supabase/migrations/001_initial.sql` y ejecuta una sola vez. Después ejecuta `supabase/migrations/002_visual_editor.sql`. La primera crea cinco tablas, las funciones de publicación/RSVP, los permisos y el bucket `wedding-assets`.
3. En **Authentication → Providers → Email**, habilita el acceso con correo y contraseña. Desactiva **Allow new users to sign up**: el sitio no tiene registro público.
4. En **Authentication → Users → Add user → Create new user**, crea tu cuenta con correo y contraseña. Confirma el correo desde el dashboard (Auto Confirm User) para poder entrar. El organizador que crea la boda será su propietario. Esta versión tiene un propietario por boda; compartir una contraseña no es el mecanismo para añadir organizadores.
5. En **Project Settings / API**, copia el **Project URL** y la clave **Publishable** (`sb_publishable_…`). Si tu proyecto solo muestra claves antiguas, puedes usar la clave `anon` en la misma variable. No uses `service_role` ni una clave secret.
6. En **Authentication → URL Configuration**, establece Site URL a `https://tu-dominio.vercel.app`. El inicio con contraseña implementado no necesita callback ni proveedor Google. Si luego añades recuperación por correo u OAuth, configura sus Redirect URLs; esos flujos no están implementados aquí.

Los nombres de los menús pueden cambiar ligeramente. La migración usa los esquemas `auth` y `storage` que ya existen en Supabase; no ejecutes los mocks de pruebas en tu base real.

## 2. Variables exactas en Vercel

En **Project → Settings → Environment Variables**, agrega estos valores para **Production** y para los entornos donde vayas a probar (Preview / Development). Configúralos **antes del build**:

| Variable                               | Valor                                                                                   | Necesaria                                       |
| -------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL, por ejemplo `https://abcdefghijklmnopqrst.supabase.co`                     | Sí                                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave Publishable `sb_publishable_…` del mismo proyecto; admite la clave antigua `anon` | Sí                                              |
| `NEXT_PUBLIC_WEDDING_SLUG`             | `ale-juan`                                                                              | Recomendada; el valor por defecto es `ale-juan` |

**No hay otras variables de aplicación.** No necesitas `SUPABASE_SERVICE_ROLE_KEY`, contraseña de base de datos, `DATABASE_URL`, un correo de admin en el código ni una contraseña de admin en Vercel. La URL de cada invitación personal se calcula a partir del dominio que estás usando.

El prefijo `NEXT_PUBLIC_` hace que los valores se incluyan en el navegador. La clave Publishable está diseñada para ese uso; los permisos reales se aplican en Supabase con RLS y funciones limitadas. Al cambiar una variable debes hacer **Redeploy**, porque Next.js incorpora las variables públicas durante el build. Para Preview, es preferible usar un proyecto de Supabase de pruebas; si reutilizas el de producción, ambos entornos editarán los mismos datos.

No cambies el slug después de crear el proyecto salvo que migres también el registro `weddings.slug`: el admin y la portada buscan por ese valor. Los enlaces `/i/…` se basan en el token y no cambian por el slug.

## 3. Desplegar en Vercel

1. Descomprime el ZIP. La carpeta raíz del proyecto es `ale-juan-invitacion/`, donde está `package.json`.
2. Sube **su contenido** a un repositorio de GitHub y usa **Vercel → Add New → Project → Import Git Repository**. Si subes la carpeta completa, selecciona `ale-juan-invitacion` como **Root Directory**. Vercel no importa un ZIP directamente mediante la pantalla de repositorios.
3. Framework: **Next.js**. Node.js: **24.x** (también compatible con 22.x).
4. Install Command: `npm ci`. Build Command: `npm run build`. Output Directory: deja la opción automática de Next.js, **no** `out`.
5. Agrega las variables indicadas arriba y despliega.
6. Abre `/admin`, inicia sesión con el usuario creado en Supabase y pulsa **Crear proyecto**. Verás los datos iniciales de Ale & Juan y el 6 de marzo de 2027.
7. Edita, sube tus archivos, guarda el borrador y pulsa **Publicar**. Antes de publicar, la portada muestra un mensaje de preparación; no expone el borrador.
8. En **Invitados y RSVP**, crea las invitaciones, cambia el nombre de cada pase y copia sus enlaces personales. Cada grupo tiene un token UUID aleatorio. Comparte un enlace solo con ese grupo.

También puedes desplegar desde tu computadora con la CLI de Vercel, dentro de la carpeta del proyecto, después de configurar tu cuenta y las variables. No se requiere una API server adicional.

## 4. Desarrollo local y validación

Requisitos: Node.js 22 o 24 y npm.

```bash
npm ci
cp .env.example .env.local
# Edita .env.local con los valores de tu proyecto.
npm run dev
```

Abre `http://localhost:3000/admin`. Para verificar el código y ejecutar producción local:

```bash
npm run typecheck
npm test
npm run build
npm start
```

`npm run check` combina TypeScript, pruebas de configuración/base de datos y build. El build puede compilar sin credenciales: la aplicación muestra instrucciones de conexión; eso **no** implica que Supabase esté conectado. Para probar flujos reales usa tus variables y la migración.

Pruebas de navegador, con un servidor HTTP de Supabase **simulado**:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright inicia la aplicación con **build de producción y `next start`**, usa puertos 3100/54321 y proporciona variables de prueba únicamente a esos procesos. No lee ni escribe tu Supabase real. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permite utilizar un Chromium ya instalado. Las capturas quedan en `test-results/`.

## 5. Funciones disponibles

- Admin privado con Supabase Auth; navegación para detalles, secciones, diseño, contenido, archivos, invitados y mesas.
- Borrador persistente y publicación explícita. Vista previa en celular, también accesible desde un teléfono. Aviso de cambios sin guardar y control de versiones para evitar sobrescribir desde otra pestaña.
- Orden real de secciones; mostrar/ocultar cada una. Fecha, nombres, itinerario, historia, vestimenta, hospedaje, regalos y mapa editables.
- Colores personalizados; fuentes independientes para títulos, subtítulos, contenido y botones, con muestra de texto.
- Fotos, fondos y fuentes persistentes en Supabase Storage. Fotos JPG/PNG/WebP se convierten a WebP de hasta 1920 px cuando el navegador lo admite; los fondos conservan sus bordes para mosaico. Límite de 10 MB por archivo. WOFF2/WOFF/TTF/OTF para fuentes; se valida que el navegador pueda leerlas antes de guardarlas.
- Galería de hasta 30 fotos con carrusel manual, cuadrícula o mosaico; máscaras y encuadre. Foto de portada y fondo en mosaico o cubriendo toda la página. Texto alternativo editable para fotos.
- Video opcional: YouTube, Vimeo o MP4/WebM subido (hasta 50 MB).
- Editor por sección, texto libre y doodles movibles, tamaño/giro/color, vista de invitado y deshacer/rehacer. Consulta ACTUALIZAR.md para el recorrido.
- Invitaciones individuales o grupales, 1–20 pases por grupo, nombres editables, búsqueda, filtros de respuesta y exportación CSV.
- RSVP por pase, nombre de acompañante, alergias opcionales, plazo y permiso para corregir. Un envío guarda todos los pases de forma atómica. Volver a abrir el enlace recupera las respuestas.
- Mesas de 1–50 lugares, asignación de confirmados y control de capacidad en la base de datos. Si alguien cancela, su mesa se libera automáticamente.
- Mostrar u ocultar la mesa a los invitados mediante una opción de configuración que debe publicarse.
- Cuenta regresiva automática desde la fecha/hora y zona horaria IANA; sin fecha fija ni desfase por el navegador.
- Estados de carga, enlace inválido, error de conexión y formularios accesibles; invitación diseñada primero para celular.

**Guardar** conserva configuración de borrador. **Publicar** actualiza la versión pública. Invitados, respuestas, asignaciones y archivos se guardan inmediatamente: no forman parte del borrador editorial. Las respuestas se actualizan al entrar al admin, recargar o usar **Actualizar respuestas**; no se implementa Realtime.

Fotos, fondos y fuentes usan un bucket público para que puedan mostrarse sin sesión. Los registros de invitados y respuestas no tienen lectura pública directa. Un archivo subido puede ser accesible mediante su URL aunque todavía no esté seleccionado en una publicación. No se permite borrar archivos desde este admin para evitar romper referencias de versiones publicadas; usa archivos nuevos para reemplazarlos y, si necesitas una limpieza, verifica primero sus referencias.

Esta versión no incluye generación de imágenes con IA, envío automático de invitaciones, registro público, importación masiva de invitados, recuperación de contraseña por correo, drag-and-drop de mesas ni colaboración con varios propietarios. Sí incluye arrastre de los elementos de diseño en la invitación; las mesas conservan su selector de asignación. La contraseña se puede restablecer administrativamente en Supabase. Son ampliaciones futuras, no botones que simulan funcionar.

## 6. Arquitectura

| Carpeta                    | Responsabilidad                                                           |
| -------------------------- | ------------------------------------------------------------------------- |
| `app/`                     | Rutas públicas, invitaciones por token, admin y estados de error          |
| `components/editor/`       | Editor visual, selección, arrastre y selector de fuentes                  |
| `components/admin/`        | Editor, carga de archivos, invitados y mesas                              |
| `components/`              | Invitación, fuentes, cuenta regresiva y formulario de RSVP                |
| `lib/config.ts`            | Contrato de configuración, valores iniciales y fechas                     |
| `lib/types.ts`             | Entidades del dominio                                                     |
| `lib/services/`            | Lecturas y mutaciones, sin consultas repartidas por todos los formularios |
| `lib/supabase/`            | Cliente autenticado del navegador y cliente público sin sesión            |
| `supabase/migrations/`     | Esquema, índices, RLS, funciones y Storage                                |
| `tests/`                   | Pruebas de contrato, SQL/permisos y flujos de navegador                   |
| `scripts/mock-supabase.ts` | Backend HTTP de pruebas; nunca forma parte de la aplicación publicada     |

Las tablas llevan `wedding_id`, están indexadas y aplican permisos por propietario. La interfaz selecciona una boda por slug; la base puede albergar más de una. Un portal comercial de varias parejas necesitaría añadir selección de proyecto, membresías y permisos por rol antes de abrir el registro.

## 7. Qué se verificó y qué queda por configurar

Consulta `VALIDACION.md` para los resultados y el alcance exacto. Se han instalado dependencias y ejecutado compilación, TypeScript, pruebas SQL y pruebas en Chromium de escritorio/celular. No se ha desplegado en tu cuenta de Vercel ni aplicado la migración en tu Supabase porque sus cuentas/credenciales no se proporcionaron.

Después de conectar tu proyecto real, comprueba una invitación de prueba de dos pases: confirmar desde otro dispositivo, recargar la respuesta, verla en el admin, subir una foto/fondo/fuente y asignar una mesa. El código de conexión está implementado, pero los servicios administrados de Auth, Storage y PostgREST solo pueden verificarse contra tu proyecto real.
