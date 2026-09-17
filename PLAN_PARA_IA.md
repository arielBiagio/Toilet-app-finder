# Plan de implementación para la siguiente IA

## 1. Objetivo y decisiones tomadas

Construir una PWA móvil para encontrar baños en National Mall y downtown Washington, DC. La experiencia debe funcionar sin cuenta para explorar, usar el radar y guardar favoritos locales. El estilo es de juego de exploración urbana: mapa legible, iconos propios, detalles pixelados y badges. El modo urgencia elimina distracciones y destaca las opciones cercanas utilizables.

La primera entrega ya preparó una tabla de investigación en Supabase. **No volver a empezar la investigación ni crear otro proyecto.** Leer los documentos y avanzar sobre lo existente.

Decisiones para evitar que la siguiente IA tenga que rediseñar el proyecto:

- Web móvil instalable, no aplicaciones nativas separadas.
- React, TypeScript y Vite; versiones estables compatibles comprobadas al implementar. Una sola aplicación, sin microservicios.
- MapLibre GL JS para renderizar el mapa; MapTiler Cloud como proveedor inicial del mapa base con plan gratuito personal/no comercial mientras corresponda al proyecto. Mantener atribución y límites; consultar condiciones antes de lanzamiento o monetización.
- Supabase para PostgreSQL y, en segunda etapa, Auth. Crear una tabla operativa revisada separada de `restrooms_seed`.
- Distancia geodésica calculada localmente para preseleccionar; navegación externa para el primer MVP. Integrar rutas a pie con openrouteservice en un incremento posterior.
- Favoritos locales primero; sincronización después del login opcional.
- Idioma inicial de interfaz: español, conservando nombres y direcciones originales en inglés. Centralizar textos para poder añadir inglés sin rehacer componentes.
- Unidades iniciales: metros/kilómetros; configuración para pies/millas en una mejora posterior.
- Horarios interpretados en `America/New_York`, independientemente de la zona horaria del teléfono.
- No incorporar un modelo de IA dentro de la app en el MVP.

Alcance territorial del producto: Mall, memoriales del Tidal Basin y corredor céntrico al norte hasta K Street/Mount Vernon Square, incluyendo International Square al oeste. Son zonas operativas del proyecto, no límites administrativos oficiales. No extender a Georgetown, Dupont, Union Station, Wharf ni al resto de DC para completar un número arbitrario.

## 2. Qué constituye una ubicación

Un registro representa un lugar al que el usuario puede dirigirse para acceder a baños, no cada inodoro. La dirección del museo no es la coordenada de la puerta del baño. Guardar entrada y recorrido interior por separado.

Reynolds Center reúne Portrait Gallery y American Art Museum. National Gallery of Art conserva dos edificios con entradas distintas, pero deben compartir un identificador de complejo para que el radar prefiera alternativas independientes cuando existan. Freer/Sackler se agrupa inicialmente. Investigar si Sylvan Theater se solapa con otra instalación antes de publicarlo.

No exigir publicar exactamente 30: hoy existen 30 candidatos de investigación. Publicar solo los que cumplan requisitos y mostrar cuántos quedan por revisar.

## 3. Recorridos y diseño de pantallas

### Explorar

Mapa a pantalla amplia, navegación inferior con Explorar, Favoritos y Perfil; botón de urgencia permanente al alcance del pulgar. En móvil, una tarjeta inferior muestra resultados sin ocultar la ubicación seleccionada. Alternar mapa/lista para accesibilidad y situaciones donde el mapa no cargue.

Solicitar ubicación al tocar «Usar mi ubicación». No pedirla de forma sorpresiva al cargar. Si se deniega o falla, permitir seleccionar un punto en el mapa y buscar nombres de lugares del catálogo. Ubicación manual y ubicación real deben distinguirse. No mostrar distancia personal hasta disponer de origen. Si el origen está lejos de DC, informar «La cobertura inicial es National Mall y downtown» y permitir explorar la zona sin simular presencia allí.

Filtros: acceso sin compra confirmado, sin pase/reserva, abierto según horario, accesibilidad documentada, cambiador documentado y limpieza mínima cuando existan reseñas. Distancia es una ordenación o radio, nunca una estrella. Un valor desconocido no satisface un filtro que exige confirmación.

Por defecto ordenar por cercanía cuando haya origen. Mostrar nombre, distancia aproximada, acceso, estado de horario y número de reseñas. No mostrar puntuaciones ficticias.

### Ficha del baño

Nombre, entrada elegida, dirección, notas interiores, condiciones de acceso, horarios y excepciones, comodidades confirmadas, fuente y fecha de investigación/verificación. Acciones: Ir, Favorito, Pude usarlo y Reportar problema. Las dos últimas se implementan con persistencia en la etapa comunitaria; mientras tanto no fingir envíos exitosos.

Separar «Documentado por el operador», «Reportado por la comunidad» y «Verificado presencialmente». La fecha de consulta web nunca se presenta como fecha de visita.

### Modo urgencia

Cambio inmediato de tema a ámbar/rojo oscuro con contraste alto. Anillos y barrido opcional sobre un mapa simplificado; conservar calles y referencias. Norte arriba en el primer MVP; no depender de brújula ni orientación del dispositivo. Lista de hasta tres opciones con un botón grande «Ir», alternativa y «Salir del modo urgencia». Sin alarmas sonoras ni destellos. Respetar preferencia de movimiento reducido.

Entrada a este modo elimina filtros de limpieza y valoración, pero conserva necesidades de accesibilidad. No debe borrar permanentemente los filtros del modo normal: restaurarlos al salir.

### Favoritos

Guardar por identificador estable. Persistir entre recargas, quitar favoritos y mostrar estado actualizado. Si un lugar se cierra o se retira, conservarlo como no disponible hasta que el usuario lo quite; no recomendarlo por estar guardado.

### Perfil

Primero perfil local con avatar y preferencias; explicar que vive en ese dispositivo. No simular sesión de Supabase. Reservar espacio para badges reales y mostrar estado vacío. Después agregar login opcional para contribuciones y sincronización.

Badges por contribuciones aceptadas: primer lugar aprobado, cinco correcciones aprobadas, diez verificaciones aceptadas. Estos umbrales son decisiones de producto modificables. La IA implementadora debe evitar recompensas por reportes duplicados o rechazados y no otorgar badges ficticios a usuarios reales.

## 4. Regla del radar

Aplicar filtros de elegibilidad antes de ordenar:

1. Solo registros operativos publicados con coordenadas de entrada revisadas.
2. Excluir cierres confirmados vigentes, privados y exclusivos para clientes. En el MVP excluir pases obligatorios: no se gestionan pases en la app.
3. Conservar requisitos explícitos de accesibilidad. Si no hay opciones que los cumplan, avisar; nunca relajarlos silenciosamente.
4. Priorizar acceso documentado y horario del baño compatible con la hora de llegada. Si el horario es solo del edificio, mostrarlo como estimación y no como confirmación del baño.
5. Dentro del mismo nivel de certeza, ordenar por tiempo a pie cuando haya rutas válidas; si no, por distancia aproximada. Nunca por limpieza ni popularidad.
6. Mostrar hasta tres resultados; preferir complejos distintos para evitar que todas las alternativas dependan de la misma entrada.

Primer MVP: distancia aproximada y navegación externa; no mostrar minutos exactos calculados desde una línea recta. Segundo incremento: preseleccionar hasta cinco candidatos por distancia y solicitar rutas peatonales, con límite de solicitudes y caché breve; ordenar por duración. Las rutas terminan en la entrada, no representan la cola de seguridad ni el recorrido interior.

Si no hay candidatos elegibles cercanos, ampliar radio por pasos configurables (propuesta inicial: 500 m, 1 km, 2 km y luego toda la zona cubierta). Informar cada ampliación; no ocultar resultados lejanos detrás de una pantalla vacía. Si solo hay horarios o accesos desconocidos, ofrecer un bloque separado «Opciones sin confirmar», nunca mezclado como si fueran garantizados. Los candidatos `venue_only` no entran en recomendaciones públicas.

Casos obligatorios: cero resultados, un resultado, ubicación denegada, precisión GPS baja, origen manual, persona fuera de DC, fallo de rutas, mapa base inaccesible, falta de red, destino que cierra antes de llegar y cambio de hora durante el uso. No afirmar que hay disponibilidad en tiempo real.

## 5. Etapas de implementación

### Etapa 0 — Inspección y preparación

Leer todo este paquete. Inspeccionar archivos existentes, instrucciones locales y tablas del proyecto Supabase antes de cualquier cambio. Confirmar que `restrooms_seed` contiene 30 IDs únicos; si el usuario ya la editó, conservar esas ediciones. Revisar estado de RLS y permisos, sin desactivarlos para facilitar pruebas.

Preparar repositorio React/TypeScript/Vite, comandos de desarrollo y build, README de configuración y variables de entorno de ejemplo sin secretos. No obtener ni imprimir claves secretas. La URL de Supabase no es una credencial. El navegador de la app solo utiliza una clave publicable y las políticas apropiadas.

Entregable: aplicación mínima que compila y documento actualizado con dependencias y configuración pendiente. Si falta acceso a un servicio, continuar con UI y adaptadores locales claramente identificados, sin inventar éxito remoto.

### Etapa 1 — Datos operativos y verificación

Crear mediante migraciones revisables las tablas mínimas `restrooms`, `restroom_sources` y `restroom_schedule_exceptions` según DATOS_Y_SUPABASE.md. Preservar `restrooms_seed` como evidencia original. Importación idempotente por `seed_id`: repetirla no duplica registros ni pisa correcciones manuales.

Añadir coordenadas obtenidas de una fuente verificable o selección manual revisada. No geocodificar en cada apertura de la app. Resolver primero direcciones de edificios y después puertas; comprobar que cada punto está en DC y en la zona prevista. Guardar proveedor y precisión, y respetar su licencia. Las referencias de parques necesitan revisión de mapa, no basta un geocodificador de direcciones.

Verificar al menos diez ubicaciones de prioridad alta de VERIFICACION_Y_FUENTES.md para una primera prueba del mapa. Esto es un hito de desarrollo, no permiso para fingir que las demás están verificadas. Mantener las restantes en borrador y seguir revisándolas para ampliar el catálogo.

Entregable: datos operativos con fuentes y coordenadas revisadas, lista explícita de pendientes y pruebas de que repetir la importación no duplica ni destruye datos.

### Etapa 2 — Explorar y ficha

Conectar lectura de ubicaciones publicadas, montar mapa y lista, geolocalización a petición y origen manual. Implementar filtros y ficha. Separar carga, error, vacío y éxito. Mantener selección sincronizada entre lista y mapa. Atribución siempre visible y controles usables con teclado.

Entregable: desde un origen seleccionado se puede abrir una ficha y navegar hasta su entrada. No hay puntos ficticios ni horarios inventados. La lista sigue funcionando ante fallo del mapa base.

### Etapa 3 — Radar

Implementar regla del apartado 4 como lógica separada de la presentación. Reutilizar los mismos datos que Explorar. El botón responde de inmediato con el catálogo disponible; las rutas se pueden enriquecer después sin bloquear toda la pantalla.

Entregable: tres alternativas cuando existan, exclusiones correctas y mensajes para incertidumbre. Probar especialmente que activar el modo nunca reintroduce un baño cerrado, con pase obligatorio o incompatible con accesibilidad.

### Etapa 4 — Favoritos, perfil local y PWA

Persistir favoritos y preferencias localmente. Incorporar manifest, iconos y caché del shell y del catálogo público revisado. Mostrar fecha de última actualización al usar datos guardados. No cachear masivamente mapas ni rutas sin permiso del proveedor; no prometer navegación offline. No almacenar historial de posiciones.

Entregable: app instalable en un navegador compatible, favoritos persistentes, perfil honesto y vista de datos guardados con advertencia de antigüedad.

### Etapa 5 — Comunidad, login y badges

Agregar Supabase Auth opcional y tablas de perfiles, favoritos, reportes, reseñas y badges. Una cuenta solo puede modificar sus propios favoritos/perfil y enviar sus propias contribuciones. Cualquier corrección del catálogo requiere revisión; clientes no pueden aprobar sus propios reportes ni adjudicarse badges.

Reportes estructurados: pude usarlo, cerrado, requiere compra, requiere pase, ubicación incorrecta, falta papel o limpieza. Almacenar momento de observación separado de envío. Limitar frecuencia y duplicados. Una reseña de limpieza contiene puntuación 1–5, fecha y autor; mostrar cantidad y antigüedad. No construir un promedio con datos de fuentes web o con ausencia de reseñas.

Moderación inicial desde Supabase o una vista administrativa protegida; no construir un gran panel antes de necesitarlo. Anotar resolución y responsable de cada reporte. Badges solo desde acciones aprobadas en servidor.

Entregable: casos de acceso entre dos usuarios probados, reportes pendientes reales y aprobación administrada. Buscar baños sigue sin requerir login.

### Etapa 6 — Rutas peatonales integradas

Integrar openrouteservice solo después de que el mapa y radar básico funcionen. Confirmar cuota, condiciones y cobertura vigentes. Guardar clave en servidor y controlar frecuencia; recalcular solo ante movimiento significativo o cambio de destino. No consultar una ruta para cada pin en cada render.

Si el proveedor falla, degradar a distancia aproximada y navegación externa, sin conservar un ETA como si siguiera vigente. En accesibilidad no afirmar que una ruta a pie es accesible: hace falta información específica del recorrido.

Entregable: rutas dirigidas a entradas revisadas, caché y manejo de cuotas comprobados, etiquetas de estimación claras.

### Etapa 7 — Prueba de campo y lanzamiento

Probar en teléfono al menos un origen en Mall oeste, otro en Mall de museos y otro en downtown. Hacer recorridos reales para confirmar entradas, barreras y horarios. Registrar fallos de la recomendación, sin recopilar historial sensible del usuario.

Comprobar diseño en 360–430 px, legibilidad bajo luz exterior, teclado, lector de pantalla, contraste y movimiento reducido. Probar red lenta, GPS denegado, expiración de sesión y cierre de la app. Elegir alojamiento gratuito compatible después de verificar límites vigentes; no contratar planes ni registrar dominio automáticamente.

Entregable: URL de prueba cuando el usuario encargue despliegue, versión reproducible, límites conocidos y lista de ubicaciones aún pendientes. No describir el prototipo como servicio de disponibilidad garantizada.

## 6. Pruebas que sí aportan valor

- Horarios en Nueva York: cambio de día, horario de verano, festivos, cierres excepcionales y rangos que cruzan medianoche.
- Diferencia entre horario del parque, del edificio y del baño; desconocido no equivale a abierto.
- Ranking: un baño muy limpio cerrado pierde frente a uno abierto; el pase obligatorio se excluye del radar; accesibilidad desconocida no satisface requisito confirmado.
- Geodatos: invertir latitud/longitud debe detectarse; no usar el centro del edificio como entrada validada; duplicados de complejos se controlan.
- RLS con usuario anónimo y usuarios A/B: borradores y datos privados inaccesibles; no editar datos ajenos; no autoaprobar reportes.
- Persistencia: favoritos sobreviven recarga y funcionan si un lugar deja de publicarse; sincronización no duplica registros.
- Integración: rutas/mapa/Supabase caídos producen un estado útil; ningún botón informa éxito si no se guardó.
- Datos de pruebas separados de producción; nunca insertar reseñas de prueba en lugares reales.

## 7. Cómo trabajar con una IA de menor costo

Ejecutar una etapa a la vez, con el plan como contrato. No pedirle que vuelva a comparar stacks. Cada entrega debe indicar cambios, pruebas, pendientes y siguiente etapa en docs/ESTADO.md. Leer solo las fuentes necesarias para la ubicación que se está validando y conservar evidencia para no repetir búsquedas.

Pedir un build y pruebas relevantes al terminar cambios funcionales; no una batería enorme por cambios de texto. Usar interfaces y funciones pequeñas para separar horarios, distancia, acceso y ranking. No añadir chatbots, pagos, redes sociales, scraping masivo, mapas 3D ni arquitectura adicional antes de cerrar el MVP.

## 8. Referencias técnicas que debe consultar quien implemente

- MapLibre: https://maplibre.org/maplibre-gl-js/docs/
- MapTiler y condiciones del plan: https://www.maptiler.com/cloud/pricing/
- Supabase tablas: https://supabase.com/docs/guides/database/tables
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Supabase límites: https://supabase.com/pricing
- openrouteservice: https://openrouteservice.org/ y https://openrouteservice.org/restrictions/
- OSM/Overpass, si se incorporan nuevos datos: https://wiki.openstreetmap.org/wiki/Overpass_API
- Política de mapas OSM: https://operations.osmfoundation.org/policies/tiles/

Las cuotas y versiones se revisan al integrar. No asumir gratuidad ilimitada. La app lee su base curada; no consulta Overpass desde cada dispositivo.
