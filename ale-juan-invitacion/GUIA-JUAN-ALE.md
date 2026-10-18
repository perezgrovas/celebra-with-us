# Paquete Juan & Ale — octubre 2026

## Qué se incluye
Proyecto Next.js de origen, sin reemplazar tu editor, más 19 imágenes WebP transparentes en `public/juan-ale/`, catálogo de recursos, galería `/arte`, botón de importación en la pestaña Recursos del administrador y paleta base ajustada para *nuevos* proyectos.

## Cómo publicar en Vercel
1. Haz copia de seguridad de tu proyecto y descarga su configuración actual desde el editor, si está disponible.
2. Descomprime el ZIP y sube el código a un repositorio Git, o utiliza `vercel` desde esta carpeta.
3. En Vercel, conecta ese repositorio al proyecto existente y conserva las variables de entorno que ya utilizabas. Lee `.env.example`.
4. Usa Node.js 22+, instala con `npm install`, compila con `npm run build`. No subas `node_modules`.
5. Comprueba `/arte` y `/admin` en la dirección desplegada.

## Supabase
**No ejecutes `001_initial.sql` otra vez en una base existente.** Este paquete no requiere migraciones nuevas. Mantén las variables de Supabase del proyecto actual y sus permisos RLS.

1. Inicia sesión en `/admin` con tu usuario habitual.
2. Entra a la sección de recursos/stickers y pulsa **Importar paquete Juan & Ale**.
3. Se subirán las imágenes al bucket `wedding-assets` y se registrarán en `assets`, sin modificar las invitaciones publicadas.
4. Regresa al editor visual y agrégalas como stickers independientes movibles desde tu biblioteca.
5. Coloca y guarda los nuevos elementos, visualiza borrador y publica cuando estés satisfecha.

### Limitaciones transparentes
- No he accedido a tus cuentas de Vercel ni Supabase, por lo que no pude desplegar ni hacer la importación en tu cuenta.
- La invitación publicada actualmente no se sobrescribe ni se rellena automáticamente al desplegar el ZIP; debes pulsar importar, colocar las imágenes y guardar/publicar.
- Las láminas de varios doodles ('fiesta-lamina', 'flores-lamina', etc.) son una sola imagen por lámina; para editar cada pequeño dibujo habrá que recortarlas y guardar cada uno aparte.
- Los PNG/WebP creados por generación de imágenes no son SVG vectoriales editables internamente.
- Las ilustraciones de pareja son aproximaciones artísticas: requieren aprobación de parecido.
- No se incluyen los originales privados de fotografías ni el video de referencia dentro del proyecto distribuible.
