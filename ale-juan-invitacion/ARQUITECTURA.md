# Decisiones de arquitectura

El punto de partida era un prototipo de 22 KB: configuración en localStorage, editor sin autenticación, fecha fija en la invitación, fuentes temporales mediante blob URL y botones sin acciones. Se sustituyó el almacenamiento local y se separaron el modelo, los servicios y los paneles de administración. No se conservan funciones de persistencia antiguas ni dos sistemas paralelos de datos.

## Datos y publicación

`weddings` mantiene `config` (borrador), `published_config` (snapshot publicado) y `version`. `save_wedding` autentica al propietario, bloquea la fila, verifica la versión que editó el cliente y valida la configuración. Solo `make_public=true` cambia el snapshot público. `unpublish_wedding` retira el acceso sin borrar los datos.

`invitation_groups` contiene el token y número de pases. `create_invitation_group` crea el grupo y sus invitados dentro de una misma transacción. El cliente no recibe permisos para insertar pases arbitrarios ni alterar el número de pases directamente.

`guests` guarda asistencia, restricciones alimentarias y mesa. Las claves foráneas compuestas impiden vincular invitados, grupos y mesas de bodas distintas. Las actualizaciones de nombre y mesa tienen permisos de columna; los campos de RSVP solo cambian mediante la función limitada al token.

`wedding_tables` contiene capacidades. El trigger de asignación bloquea la mesa destino antes de contar ocupantes y rechaza una mesa completa. Quita la asignación cuando el invitado deja de asistir. La prueba local verifica capacidad y referencias cruzadas; la prueba de carreras entre conexiones se debe realizar en una instancia PostgreSQL externa, porque PGlite es una instancia embebida de conexión única.

`assets` es el catálogo de fotos, fuentes y fondos. Storage conserva los bytes. Los archivos llevan una ruta `wedding_id/asset_id.extension` y la política de escritura exige ser propietario de ese wedding_id. Las fuentes tienen familias únicas que se recrean con FontFace desde su URL persistente. La eliminación de objetos solo se permite para objetos todavía sin registro de asset, para limpiar una subida cuya inserción falló.

## Lectura pública

La portada lee `get_public_wedding(slug)` y recibe solo la configuración publicada y los assets usados por ella. No recibe invitados.

La ruta `/i/[token]` usa `get_invitation(token)` para recibir únicamente los pases de ese grupo. No expone el token en metadata ni envía el padrón completo. La ruta es dinámica, no indexable y usa `Referrer-Policy: no-referrer` para que los enlaces externos no reciban el token como Referer. El token es una credencial por posesión: quien recibe el enlace puede leer y responder esos pases.

`submit_rsvp` bloquea el grupo, verifica publicación, fecha límite en la zona horaria configurada, permiso de corrección, IDs de los pases, cantidad exacta de respuestas y estados permitidos. Es atómico: si una respuesta falla, ninguna se guarda. Limita nuevos envíos del mismo grupo a uno cada tres segundos; Supabase Auth y la plataforma pueden aplicar límites adicionales de tráfico.

## Autenticación y acceso

El admin es una interfaz cliente con acceso por correo y contraseña. La protección de datos está en RLS y los permisos SQL, no en ocultar componentes. No se usa una clave service_role. Las funciones SECURITY DEFINER tienen search_path vacío y se revoca su ejecución por PUBLIC; solo se otorgan los permisos concretos necesarios. Los helpers internos viven en `app_private`.

Auth conserva su sesión en el navegador. La configuración de la boda no se guarda en localStorage. Un cambio de contraseña o un cierre de sesión afecta la sesión, no los datos persistentes.

## Alcance

La aplicación es un proyecto desplegable en Vercel con integración de Supabase implementada. La infraestructura remota la crea el titular con la migración y variables documentadas. El bucket de assets es público por diseño; las tablas de invitados tienen lectura exclusiva para el organizador y las funciones por token.

Un registro comercial para varias parejas, varios editores por boda, recuperación por correo y migración desde otra base no se incorporaron como soluciones parciales. La separación actual permite agregar esas funciones con contratos específicos.

## Editor visual (versión 3)

`lib/design.ts` define un modelo versionable dentro de `config.design`: ajustes por sección, capas libres, posiciones móviles, galería, video y paletas propias. Los documentos antiguos reciben valores predeterminados sin perder sus datos. `lib/config.ts` sigue siendo el contrato compartido con validación Zod.

`components/editor/VisualEditor.tsx` coordina selección, herramientas, historial limitado a 30 pasos y carga de assets. FontPicker, Movable, PhotoGallery y los catálogos locales separan recursos, movimiento y presentación. El editor y la página pública usan el mismo componente Invitation; la vista del invitado elimina los controles. El historial es temporal; guardar y publicar siguen pasando por la API existente con control de versión.

La migración 002 amplía el validador existente conservando las reglas de propietario, RSVP y publicación. Valida referencias de assets de la misma boda y expone solo archivos usados en la versión publicada. Añade stickers y video al catálogo/bucket. Es aditiva y admite repetición; los proyectos existentes no deben reejecutar 001.

Las 48 fuentes se sirven localmente, con carga de las familias usadas y de las miniaturas de la categoría abierta. El manifiesto registra origen, versión, licencia y hash; los textos completos de licencia viajan en el proyecto. Los doodles son SVG originales, no archivos externos ejecutables.

Los videos embebidos aceptan hosts exactos de YouTube/Vimeo. El iframe envía solo el origen mediante `strict-origin-when-cross-origin`; así evita revelar el token del invitado y permite la reproducción de YouTube. Los demás enlaces mantienen la política general. Las subidas de video admiten MP4/WebM hasta 50 MB; el límite de fuentes y demás archivos sigue siendo 10 MB. No hay reproducción automática ni transcodificación de video.
