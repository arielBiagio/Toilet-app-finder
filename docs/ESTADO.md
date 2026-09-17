# Estado del proyecto y traspaso

Última actualización: **2026-09-17 — etapas 0–4 implementadas; catálogo operativo sin ubicaciones publicadas**.

## Completado en esta entrega

- Investigación web de National Mall y downtown Washington, DC.
- Selección de 30 ubicaciones: 20 Mall y 10 downtown.
- Tabla `public.restrooms_seed` creada en el proyecto Supabase **Baños app**, referencia `modtdxajnwaesgxjbekw`.
- Importación de 30 filas y 14 columnas: nombres, direcciones/referencias, acceso, evidencia, horarios del establecimiento disponibles, notas de entrada, comodidades, URLs y fecha de investigación.
- Clave primaria `id` y RLS activado; sin políticas públicas creadas.
- Copia local JSON y catálogo legible.
- Plan de implementación, diccionario de datos y pendientes de verificación por ubicación.
- Etapa 0: proyecto React 19 + TypeScript + Vite creado en la raíz, con una pantalla inicial móvil y accesible que comunica que el catálogo sigue en revisión.
- Etapa 0: `.env.example`, `.gitignore`, comandos `dev`, `check`, `build` y `package-lock.json` añadidos. No hay secretos en el repositorio ni cliente de Supabase instanciado.
- Etapa 1: migración versionada en `supabase/migrations/202609170001_create_operational_restrooms.sql`, aplicada mediante SQL Editor al proyecto Supabase existente. Crea `restrooms`, `restroom_sources` y `restroom_schedule_exceptions` sin modificar ni eliminar `restrooms_seed`.
- Etapa 1: importación inicial completada con `seed_id` único y `ON CONFLICT DO NOTHING`. Se crearon 30 borradores operativos y 60 vínculos de fuentes; no se sobreescriben correcciones manuales al repetir la importación.
- Etapa 1: las tres tablas nuevas tienen RLS habilitado y no tienen políticas. Ninguna fila queda accesible desde la clave publicable hasta una etapa posterior de publicación.
- Etapa 2: pantalla Explorar implementada con MapLibre GL JS, controles de origen solicitado por el usuario, selección manual de coordenadas, filtros de acceso/horario/accesibilidad y estados útiles de mapa/catálogo vacío. MapLibre se activa solo con `VITE_MAPTILER_KEY`.
- Etapa 3: modo urgencia implementado con tema de alto contraste, anillos de radar sin destellos, salida clara y control de accesibilidad persistente. La lógica en `src/lib/radar.ts` excluye borradores, entradas no revisadas, cierres, pases obligatorios, accesos privados y horarios incompatibles; ordena por distancia y evita repetir complejos.
- Etapa 4: favoritos y preferencia de accesibilidad del radar se guardan localmente en el navegador mediante `src/lib/localProfile.ts`; no requieren cuenta ni se envían a Supabase. Las fichas todavía no existen porque el catálogo publicado está vacío.
- Etapa 4: PWA configurada con `vite-plugin-pwa`, manifiesto en español e icono local. El service worker precachea únicamente el shell y sus recursos generados; `runtimeCaching` está vacío, por lo que no almacena tiles de MapTiler, rutas ni historial de ubicación.
- Etapa 4: Perfil declara con claridad que no hay cuenta ni copia local del catálogo público. Cuando exista una copia local futura, deberá mostrar su fecha de actualización; hoy no se presenta una fecha ficticia.
- Rediseño móvil posterior a la etapa 4: la app ahora tiene tres pantallas completas e independientes. Explorar muestra el mapa a todo el ancho del contenedor y una hoja de resultados desplazable; Favoritos y Perfil tienen sus propias cabeceras, estados vacíos y contenido. La navegación inferior permanece fija y el modo urgencia conserva el radar sobre el mapa.
- Ajuste de interfaz móvil: se eliminó la barra superior y los controles de zoom; el mapa ocupa aproximadamente 67% de la altura visible. SOS y ubicación son controles circulares opuestos en las esquinas inferiores. Al recibir coordenadas, MapLibre crea un marcador azul y centra el mapa con una transición. El texto del modo urgencia se redujo y las pantallas incorporan una animación breve de entrada.

## Comprobaciones realizadas

- Table Editor confirmó **30 records** con rol postgres después de guardar.
- Vista con rol **anon** devolvió **0 records**, coherente con RLS sin política de lectura pública. Se restauró la vista postgres. Esta es una comprobación de lectura desde el panel, no una prueba completa de todas las operaciones de la futura API.
- El texto importado coincidió en longitud y checksum con el generado desde el JSON local: 13.255 caracteres, checksum FNV-1a de control `8b2429b`. Esto compara el contenido preparado para importación, no un volcado posterior de toda la base.
- Se revisó visualmente la tabla cargada: nombres, direcciones y categorías aparecen en sus columnas; el panel informó la cantidad esperada.
- `npm run check` completó sin errores de TypeScript.
- `npm run build` completó con éxito: Vite generó `dist/` con 29 módulos transformados. El build y el servidor local requirieron ejecución fuera del sandbox por una limitación de lectura del entorno, no por un error de la app.
- Se abrió `http://127.0.0.1:5173/` y se verificaron título, aviso de catálogo, cobertura y navegación de la pantalla inicial. La pantalla no muestra registros ni hace solicitudes a Supabase.
- El archivo `index.html` requiere el servidor de Vite; abrirlo como `file:///...` bloquea los módulos TypeScript por CORS. La instrucción de arranque y la alternativa de vista previa quedaron aclaradas en README.
- SQL de verificación remota: `restrooms=30`, `restroom_sources=60`, `drafts=30` y `coordinate_pairs=0`.
- SQL de idempotencia: `rows=30`, `distinct_seed_ids=30`, `missing_seed_ids=0`.
- SQL de seguridad: `restrooms`, `restroom_sources` y `restroom_schedule_exceptions` devolvieron `rls_enabled=true` y `policies=0`.
- `npm run check` y `npm run build` completaron correctamente tras incorporar MapLibre GL JS. Se verificó en navegador el estado sin clave de mapa y el flujo de origen manual con `38.8895, -77.0280`.
- La integración de MapTiler se validó desde `.env.local` mediante un servidor local: el mapa, controles de zoom y atribución de MapLibre cargaron correctamente. La clave no se agregó a archivos versionables ni a documentación.
- La transición a modo urgencia y su estado vacío se verificaron en navegador. No muestra candidatos mientras el catálogo operativo no tenga registros publicados elegibles.
- `npm run check` completó sin errores después de añadir el registro PWA y sus tipos.
- `npm run build` completó correctamente con `vite-plugin-pwa` 1.3.0: generó `dist/manifest.webmanifest`, `dist/sw.js` y `dist/workbox-9c191d2f.js`. El build conserva una advertencia de tamaño del bundle principal: 1.256,74 kB sin comprimir y 352,16 kB gzip; conviene dividir MapLibre antes de un despliegue de producción amplio.
- Inspección del `dist/sw.js`: precache de 7 recursos propios, ruta de navegación al shell y ninguna referencia a `maptiler`; por tanto no hay regla de caché runtime de mapas o rutas.
- Verificación visual local en `http://127.0.0.1:5175/`: mapa base, controles, botones de navegación y el estado honesto de cero publicados están presentes.

## Pendiente, no simular como completado

- Coordenadas de entrada y precisión de localización. La primera tanda de revisión sigue siendo IDs 1, 2, 9, 10, 11, 14, 15, 16, 19 y 22. Los valores de dirección, horarios del establecimiento y notas ya están importados, pero no se convirtieron en coordenadas ni en entradas verificadas.
- Verificación de horarios específicos de baños; los existentes son horarios documentados del establecimiento.
- Confirmación de acceso, especialmente Planet Word, International Square, MLK Library, National Building Museum y Ronald Reagan Building.
- Evidencia específica de baños para candidatos `venue_only` (IDs 3, 26 y 29).
- Visitas de campo y resolución de posible duplicado en Sylvan Theater.
- Políticas de lectura de registros publicados y permisos de usuarios. Las tablas operativas y su migración ya están implementadas; no hay todavía ninguna política de lectura porque todos los registros continúan en borrador.
- Lectura desde el frontend de filas publicadas, fichas reales de favoritos, cuentas, contribuciones y fecha de una futura copia local del catálogo.
- Configuración de proveedor de mapas/rutas y despliegue.
- Clave pública restringida de MapTiler para mostrar el mapa base. Sin ella, la pantalla usa su estado alternativo accesible y no carga mapas de terceros.

## Próxima acción recomendada

Continuar con la **validación geográfica restante de la etapa 1**. Añadir una migración posterior solo para coordenadas que hayan sido revisadas contra una fuente apropiada o selección manual documentada; indicar `location_precision` correctamente y mantener `publication_status='draft'` hasta tener entrada, acceso y evidencia suficientes. No usar el centro de un edificio como si fuera una entrada ni incluir candidatos `venue_only` en recomendaciones. Después, crear las políticas de lectura y ejecutar la etapa 5 contra esas filas publicadas.

## Registro para siguientes entregas

Al completar cada etapa, agregar fecha, etapa, archivos/tablas modificados, pruebas realizadas, resultado, limitaciones y siguiente paso. Distinguir siempre trabajo implementado, solo diseñado y bloqueado por acceso o información pendiente.
