# Actualizar tu página actual — Celebra with Us

Tu invitación ya está en Vercel y Supabase. **No crees otro proyecto, no cambies las variables y no vuelvas a ejecutar `001_initial.sql`.** Esta actualización conserva la boda, invitados, respuestas, tokens, mesas y archivos actuales.

## 1. Actualizar Supabase

1. Descomprime este ZIP.
2. Abre `ale-juan-invitacion/supabase/migrations/002_visual_editor.sql` como texto.
3. Copia todo su contenido.
4. En el **mismo proyecto de Supabase** que usa tu página, entra a SQL Editor → New query, pega el SQL y pulsa Run.
5. Espera el mensaje de éxito. La operación no borra tus datos. La actualización se puede volver a ejecutar sin recrear las tablas.

Haz este paso antes de subir el nuevo código. La aplicación anterior seguirá funcionando mientras terminas.

## 2. Reemplazar archivos en GitHub

Tu repositorio es `perezgrovas/celebra-with-us`, y el código está en su carpeta `ale-juan-invitacion`.

1. Abre el repositorio y entra a la carpeta **`ale-juan-invitacion`**.
2. Selecciona **Add file → Upload files**. Sube primero las carpetas **`public` y `licenses`** que están dentro de la carpeta descomprimida. Conserva sus carpetas; no subas los archivos de fuentes sueltos a la raíz. Pulsa Commit changes.
3. Vuelve a **Add file → Upload files** en la misma carpeta del repositorio. Sube el resto del contenido del proyecto: `app`, `components`, `lib`, `supabase`, `scripts`, `tests`, los archivos de configuración, `package.json`, `package-lock.json` y los documentos. No vuelvas a incluir `public` ni `licenses` en esta segunda carga. Pulsa Commit changes.

Las dos cargas mantienen cada lote por debajo de 100 archivos. No subas el ZIP y no crees otra carpeta `ale-juan-invitacion` dentro de la existente. Reemplaza los archivos con los mismos nombres. No se incluyen dependencias ni carpetas de build en la entrega.

Si usas Git desde tu computadora, puedes reemplazar el árbol completo y subirlo en un único commit en vez de usar estas dos cargas.

## 3. Esperar el despliegue

Vercel desplegará automáticamente al detectar los commits de la rama `main`. Espera a que **el último** despliegue diga Ready. Si falla, abre Build Logs y comparte el primer error.

Conserva:

- Root Directory: `ale-juan-invitacion`.
- Framework: Next.js.
- Node: 24.x (también 22.x).
- Variables actuales: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_WEDDING_SLUG`.

## 4. Probar el editor

Abre `https://celebra-with-us.vercel.app/admin` e inicia sesión como siempre. Entrarás a **Diseñar invitación**.

1. Elige una sección en «Estás diseñando».
2. En «Acomodo», selecciona un diseño predeterminado. Si tiene foto, usa «Fotos» para elegirla.
3. Toca un título o texto de la invitación. Puedes moverlo arrastrando o con las flechas del teclado. Los textos se editan en el panel.
4. En «Doodles», elige el tipo de evento y agrega un dibujo. Se puede mover, girar, redimensionar, recolorear y quitar. Puedes subir PNG transparentes propios.
5. En «Letras», elige una fuente por función o agrega texto libre. El selector muestra 12 opciones por categoría, con ejemplo real.
6. En «Fotos», prueba «Ver foto completa», «Llenar el espacio», una forma y los controles de encuadre. En la sección Fotos, marca las imágenes de tu galería y elige carrusel, cuadrícula o mosaico.
7. En «Colores», aplica una paleta o pulsa «Crea tu paleta de color». En «Fondos», elige una textura, imagen general o color de una sección.
8. En «Video», pega un enlace de YouTube/Vimeo o sube un MP4/WebM de hasta 50 MB. Activa o desactiva la sección según quieras mostrarla.
9. Alterna Celular / Escritorio. Los elementos libres pueden tener posiciones diferentes para ambos tamaños. El contenido principal se adapta con su acomodo responsive.
10. Usa «Vista previa» para ver el resultado sin controles de edición. En un teléfono, la vista de escritorio se puede recorrer horizontalmente.
11. Pulsa **Guardar** para conservar el borrador y **Publicar** para cambiar la invitación que ve tu gente.

Deshacer/Rehacer conserva hasta 30 cambios de la sesión del editor. Al recargar se conserva el diseño guardado, pero no el historial de deshacer. Los elementos libres están asociados a una sección; para mover uno a otra sección, elimínalo y añádelo en la nueva.

Las secciones se pueden ocultar sin perder su contenido. Ocultar una sección de fotos o video retira ese contenido de la invitación, sin borrar el archivo de tu cuenta. La galería tiene navegación manual, sin reproducción automática. Los videos tampoco se reproducen solos.

Los botones de fotos y video suben archivos reales. Los archivos de imágenes mantienen un límite de 10 MB; las fotos se optimizan antes de subirlas, los PNG de stickers conservan su transparencia y los fondos conservan sus bordes.

## Tipografías y colores

Hay **48 familias, 12 en cada categoría**: Caligrafía, Manuscritas, Serif elegantes y Modernas. Todas llevan su licencia y archivos locales: la invitación no depende de cargar Google Fonts desde otra web.

Se verificaron paquetes de DaFont para **Tangerine, Pacifico y Quicksand**. Las otras 45 se incluyen desde Fontsource, con sus licencias OFL/Apache verificadas. No se afirma que sean las 12 más descargadas o mejor valoradas de DaFont: es una selección editorial para invitaciones. Las páginas y paquetes de DaFont que no se pudieron verificar se excluyeron. El catálogo completo y su procedencia están en `TIPOGRAFIAS.md` y `lib/font-catalog.json`; los avisos íntegros están en `licenses/fonts` y también se sirven en `/fonts/LICENSES.txt`.

Hay 12 paletas propias pensadas para celebraciones, más las que crees tú. Se revisó Adobe Color como referencia de combinaciones; no se copió ni se presenta un ranking o una colección extraída de Adobe. Los doodles son dibujos originales del proyecto, organizados en Bodas, Cumpleaños, Bautizos, Primera comunión, Fiestas y Conciertos.

## Si necesitas volver a la versión anterior

Antes de reemplazar, puedes descargar el ZIP del repositorio actual en GitHub → Code → Download ZIP. La migración es compatible con la aplicación anterior para sus configuraciones de 11 secciones. Después de guardar un diseño nuevo con Video, no publiques desde el editor antiguo: no conoce esa sección. Mantén el nuevo editor una vez que hayas guardado un diseño nuevo. No elimines las tablas para intentar volver atrás.
