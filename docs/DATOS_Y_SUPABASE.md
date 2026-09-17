# Datos y Supabase

## Base existente

Proyecto **Baños app**, referencia `modtdxajnwaesgxjbekw`; URL `https://modtdxajnwaesgxjbekw.supabase.co`.

Tabla **public.restrooms_seed**, creada y cargada desde el Table Editor el 2026-09-17. Tiene 30 filas y 14 columnas. `id` es `int8` y clave primaria; las otras columnas son `text`. Es una tabla de investigación, apropiada para editar datos originales sin convertir notas inciertas en atributos definitivos. No se generaron migraciones SQL ni código de aplicación en esta entrega.

RLS se mantuvo activado. No se crearon políticas de acceso público. Que una tabla esté en `public` o expuesta por Data API no significa que sus filas se puedan leer anónimamente: también intervienen permisos y RLS. No desactivar RLS para conectar el frontend.

El JSON local contiene los mismos valores de la carga inicial. Campos vacíos son desconocidos o no investigados, no respuestas negativas. La importación del panel puede representar vacíos como cadena vacía o NULL: normalizarlos a NULL al crear el modelo operativo.

## Diccionario de las columnas actuales

| Campo | Significado y regla |
| --- | --- |
| id | Identificador estable del candidato, 1–30. No confundir con ID de OSM. No renumerar. |
| name | Nombre del lugar y, cuando se conoce, instalación concreta. |
| zone | `national_mall` o `downtown`; clasificación del producto. |
| address | Dirección o referencia física dentro de Washington, DC, Estados Unidos. No es siempre una dirección postal completa. |
| address_precision | `venue`: edificio; `entrance`: dirección de entrada publicada, aún sin pin revisado; `landmark`: referencia de parque o monumento. |
| access_policy | Condición documental inicial; valores definidos abajo. |
| evidence_status | Qué confirma realmente la evidencia, definido abajo. |
| venue_hours_text | Horario textual del establecimiento/parque cuando se documentó. **No es horario confirmado del baño**. Puede incluir excepciones y rangos nocturnos. |
| entrance_notes | Instrucciones, diferencias entre instalaciones y preguntas pendientes. No interpretar todo el texto como hecho confirmado. |
| amenities_notes | Comodidades mencionadas por la fuente. Requiere lectura antes de convertir a filtros booleanos. |
| restroom_source_url | Fuente de baños o, para `venue_only`, fuente del establecimiento que necesita investigación adicional. |
| venue_source_url | Fuente de dirección/horario/contexto; a veces coincide con la anterior. |
| researched_on | Fecha de consulta web, guardada como texto ISO `2026-09-17`. No es fecha de visita, publicación ni actualización de la fuente. |
| publication_status | `draft` en todos los registros. No publicar automáticamente al importar. |

## Vocabularios de investigación

`evidence_status`:

- `official_restroom`: una fuente oficial, institucional u operadora menciona baños. No implica verificación presencial, ausencia de restricciones o apertura actual.
- `community_restroom`: testimonio comunitario de un baño; requiere confirmación del operador o visita.
- `venue_only`: dirección/establecimiento confirmado; evidencia específica del baño todavía insuficiente.

`access_policy`:

- `public_restroom`: instalación descrita como baño público por la fuente.
- `museum_no_pass`: museo cuya admisión general no exige pase según la fuente; todavía pueden existir controles, colas y restricciones particulares.
- `free_venue_access`: establecimiento gratuito; confirmar recorrido al baño y acceso durante la visita. No equivale a entrada irrestricta.
- `timed_pass_required`: pase obligatorio documentado; excluir del radar inicial.
- `access_unconfirmed`: falta resolver la política aplicable al baño, incluso si existe evidencia de su existencia.

## Modelo operativo que debe implementar la siguiente IA

Crear tablas tipadas con migraciones versionadas. Conservar el seed; no usar sus textos directamente para decidir «abierto ahora». Evitar una arquitectura excesiva para 30 registros.

### restrooms

| Grupo | Campos propuestos | Reglas |
| --- | --- | --- |
| Identidad | id UUID; seed_id bigint único y nullable; name; complex_id nullable; zone; venue_type | seed_id vincula la importación; nuevos aportes no necesitan seed. |
| Ubicación | address; city; region; country; entrance_latitude; entrance_longitude; location_precision; geocode_source_url; geocoded_at | Coordenadas numéricas nullable, lat −90…90, lon −180…180; en conjunto ambas presentes o ambas ausentes. No usar 0/0. |
| Entrada | entrance_notes; floor; indoor_instructions; entrance_verified_at | Entrada y localización del baño son conceptos distintos. No rellenar con centroide del museo. |
| Acceso | access_type; requires_purchase; requires_ticket; fee_usd; security_screening | Valores desconocidos NULL. access_type: public / venue_visitors / customers / permission_required / private / unknown. Un pase gratuito sigue siendo required_ticket=true. |
| Horario | timezone; venue_hours_text; restroom_weekly_hours; hours_basis; last_entry_minutes_before_close; hours_verified_at | timezone America/New_York. hours_basis: restroom / venue_inferred / unknown. Las reglas semanales se documentan y validan antes de cargarlas. |
| Comodidades | wheelchair_access; changing_table; family_restroom; gender_neutral | wheelchair_access: yes / limited / no / unknown. Otros booleanos nullable. Accesibilidad del edificio no acredita la del baño. |
| Estado | publication_status; operational_status; temporary_closure_until; operational_checked_at | publicación: draft / published / archived. operación: unknown / operating / temporarily_closed / permanently_closed. operating no significa abierto en este minuto. |
| Evidencia | evidence_status; researched_at; field_verified_at; updated_at | No rellenar field_verified_at a partir de consulta web. Todas las fechas con semántica explícita. |

No persistir como hecho permanente `is_open_now`, `distance`, `walking_minutes`, ni un rating inventado. Se calculan a partir de horario, origen y reseñas en el momento de consultar. La publicación debe exigir evidencia de baños, acceso revisado y coordenadas revisadas; se puede publicar con horario desconocido, indicándolo y excluyéndolo del grupo de urgencia con horario fiable.

### Horarios semanales y excepciones

Para el MVP, `restroom_weekly_hours` puede ser JSONB validado: siete días ISO, cada uno con estado open/closed/unknown e intervalos de apertura/cierre en hora local. Documentar el formato exacto en la implementación. Un día desconocido se diferencia de un día confirmado cerrado. Representar explícitamente cierres después de medianoche, sin invertir horas por error.

`restroom_schedule_exceptions`: id, restroom_id, fecha local, closed boolean, intervalos alternativos si corresponde, source_id y nota. La excepción tiene prioridad sobre el calendario semanal. Conservar por separado la última hora de admisión del edificio. El horario de un parque 24/7 nunca se copia a sus baños.

Si solo se conoce el horario del establecimiento, puede usarse como estimación etiquetada, pero no convertirlo en horario confirmado del baño. No inventar tiempo de cola ni precisión del ETA interior.

### restroom_sources

id; restroom_id; url; publisher; source_kind (operator / government / community / other); claim_scope (address / restroom_existence / access / hours / amenities / location); summary; source_published_at nullable; source_updated_at nullable; retrieved_at; verification_method (web / operator_contact / field_visit); reviewed_by nullable.

Cada afirmación importante debe tener una fuente adecuada. Una misma URL puede respaldar varios ámbitos, pero no asumir que confirma campos que no menciona. Guardar resúmenes propios breves; no copiar artículos o comentarios enteros. No importar contenido de grupos privados ni enviar mensajes a operadores sin encargo del usuario.

### Tablas para una fase posterior

- `profiles`: user_id de Auth como PK, display_name, avatar, preferencias, timestamps. Roles administrativos fuera de campos editables por el cliente.
- `favorites`: user_id y restroom_id con combinación única; favoritos privados.
- `reports`: id, author_id, restroom_id, tipo, comentario breve opcional, observed_at, submitted_at, status pending/accepted/rejected, reviewer_id y resolución.
- `reviews`: author_id, restroom_id, cleanliness 1–5, comentario opcional, observed_at, created_at y estado de moderación. Limitar duplicados; agregados calculados solo sobre reseñas admisibles.
- `badges` y `user_badges`: definiciones y premios con restricción de unicidad; adjudicación en servidor a partir de contribuciones aprobadas.

Fotos y almacenamiento de medios quedan fuera del MVP. No crear tablas vacías de funciones futuras solo por completar una lista.

## Permisos esperados

| Recurso | Anónimo | Usuario autenticado | Administración |
| --- | --- | --- | --- |
| restrooms_seed | Sin lectura ni escritura | Sin lectura ni escritura | Revisión e importación |
| restrooms publicado + fuentes públicas | Lectura de campos públicos | Lectura de campos públicos | Edición y publicación |
| Borradores y revisión interna | Sin acceso | Sin acceso | Lectura/escritura |
| Favoritos y perfil privado | Sin acceso remoto | Solo propios | Solo cuando sea necesario |
| Reportes | Sin escritura en MVP | Enviar y consultar los propios | Revisar y resolver |
| Reseñas publicadas | Lectura de datos públicos mínimos | Editar/enviar propias según política | Moderación |
| Badges | Solo información pública decidida por producto | Lectura propia; no adjudicarse | Asignación controlada |

RLS en cada tabla expuesta, con pruebas negativas. No colocar service role/secret keys en Vite, navegador, repositorio ni archivos de documentación. Restringir la clave pública del proveedor de mapas por dominio cuando lo permita. La URL del proyecto y una clave publicable no sustituyen las políticas.

## Importación y mantenimiento

1. Inspeccionar la tabla remota antes de cualquier carga; no crear duplicados.
2. Mantener el seed como registro de investigación. Convertir vacíos a NULL en el modelo operativo.
3. Mapear campos con las reglas anteriores y conservar relación con seed_id.
4. Solo completar campos a partir de evidencia pertinente. No asignar coordenadas aproximadas como verificadas.
5. Reimportar sin sobrescribir revisiones manuales; si difieren, registrar un cambio pendiente de revisión.
6. Actualizar fuente y fecha al modificar horarios o acceso. Historial mínimo en notas o tabla de cambios si ya hay contribuciones.
7. Revisar periódicamente registros publicados. La caducidad para ranking será una regla de producto configurable, no una garantía de que algo es correcto por ser reciente.

El conjunto inicial fue recopilado manualmente; no incluye una descarga de OSM. Si después se incorporan sus datos, registrar IDs originales, atribución y condiciones ODbL. Consultar [licencia de OSM](https://www.openstreetmap.org/copyright) y los términos de cada proveedor antes de combinar o redistribuir bases.
