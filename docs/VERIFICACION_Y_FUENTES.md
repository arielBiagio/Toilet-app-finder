# Verificación de ubicaciones y fuentes

Investigación web del 2026-09-17. El dataset contiene 30 lugares, con 20 clasificados National Mall y 10 downtown. Las fuentes se guardan por fila en `data/restrooms_seed.json`. No se realizó visita presencial, llamada ni comprobación en tiempo real de puertas abiertas.

## Qué puede afirmarse hoy

- 25 registros tienen una mención de baños en fuente oficial, institucional u operadora. La categoría incluye Archives Foundation y DowntownDC BID; no significa exclusivamente páginas gubernamentales.
- 2 tienen evidencia comunitaria de baños: MLK Library e International Square. Sus direcciones se contrastaron por separado.
- 3 son candidatos con establecimiento documentado y baño pendiente de confirmar: American Indian Museum, National Building Museum y Ronald Reagan Building.
- Todos están en borrador; ninguno tiene coordenada de entrada revisada ni rating. No se considera una fuente antigua «actualizada» porque un buscador la haya rastreado recientemente.

## Prioridad para la primera validación

Primera tanda propuesta: IDs **1, 2, 9, 10, 11, 14, 15, 16, 19 y 22**. Tienen evidencia útil de baños e instrucciones para empezar a ubicar entradas. Segunda tanda: **20, 21, 23, 24, 27 y 30**, para mejorar cobertura del borde este y downtown. La prioridad es una decisión de investigación; no afirma que sean los más limpios o cercanos.

Para cada lugar, completar entrada exacta, recorrido interior, acceso sin compra/pase, horario específico del baño o incertidumbre explícita, comodidades y fuente. Un pin de edificio solo puede mostrarse como aproximado en una vista de investigación, nunca como destino confirmado del radar.

## Pendientes concretos por ID

| ID | Comprobación necesaria |
| --- | --- |
| 1 | Elegir entrada Constitution/Mall y localizar el baño; confirmar horario y recorrido. |
| 2 | Ubicar baño y entrada actual; usar guía de accesibilidad vigente en lugar de antiguos artículos de familias. |
| 3 | Abrir mapa oficial y documentar baños. El sitio de visita acredita dirección y entrada sin pase, no la ubicación del baño. |
| 4 | Confirmar horario de lunes y ruta a Lower Level; no crear pin en Sculpture Garden cerrado. |
| 5 | Confirmar baños accesibles desde entrada este; evitar que Freer/Sackler y African Art compartan un mismo baño duplicado. |
| 6 | El plano mantiene copyright 2012: corroborar configuración y cambiadores actuales. |
| 7 | Pase obligatorio; mantener fuera del radar sin pase. |
| 8 | Pase obligatorio; horario distinto los lunes y excepciones de festivos. |
| 9–10 | Entradas oficiales distintas, mismo complejo NGA. Revisar horarios en página de visita; evitar duplicar baño del túnel. |
| 11 | Mantener separado el baño exterior sur del Undercroft con pase y control de seguridad. No atribuir cambiador de adultos del Undercroft al exterior. |
| 12 | Localizar edificio de baños, no el centro del memorial. Revisar avisos vigentes; un aviso temporal anterior no prueba cierre actual. |
| 13 | Ubicar edificio de información/librería y horario. El registro no cubre automáticamente otros bloques del memorial. |
| 14 | Baños de nivel inferior; apertura 24 h del parque no equivale a baños 24 h. |
| 15 | Entrada exterior tras librería; confirmar horario independiente de librería. |
| 16 | Lodge con entradas exteriores; conservar advertencia de giro estrecho al clasificar accesibilidad. |
| 17 | Identificar instalación cercana a Sylvan Theater y descartar solapamiento con Lodge/Survey Lodge. Archivar/combinar si es duplicado, sin forzar 30 publicaciones. |
| 18 | Situar baño hacia esquina suroeste del estanque y comprobar operación actual. |
| 19 | Geolocalizar parte posterior del centro de visitantes; horario de baño distinto de memorial si corresponde. |
| 20 | Confirmar horario de Conservatory y puerta apropiada; no usar horario del jardín exterior. |
| 21 | Verificar con plano u operador el acceso al baño, piso y política de biblioteca. Reddit es solo evidencia comunitaria. |
| 22 | Un edificio compartido; entrada accesible 8th/G; no crear otro registro por cada museo. |
| 23 | Horario del baño no está confirmado; el parque publica amanecer–anochecer. |
| 24 | Confirmar horario y controles del Visitor Center; no confundir con tour de la Casa Blanca. |
| 25 | Resolver acceso al lobby sin pase y conservar cierres excepcionales publicados. |
| 26 | Verificar que el baño sea accesible desde Great Hall gratuito sin ticket de exposición. |
| 27 | Entrada Constitution; reserva no obligatoria según fuente consultada. No usar entrada de investigadores. |
| 28 | Determinar si el testimonio corresponde al baño actual de The Square, y acceso sin compra; comprobar entrada del complejo. |
| 29 | Falta evidencia específica de baño público y condiciones. Horario del edificio 05:00–02:00 no se hereda al baño ni al food court. |
| 30 | Baños de planta 2 de DC History Center; no heredar horario del Apple Store que ocupa otra planta. Revisar festivos. |

## Lugares y fuentes descartados de la carga

- **Renwick Gallery**: directorio Smithsonian consultado indica cierre y reapertura prevista el 13 de noviembre. No se incluye entre las 30. Reconsultar antes de añadir; no asumir año/fecha cumplida sin verificación. [Directorio Smithsonian](https://www.si.edu/visit/museums).
- **Smithsonian Castle**: figura cerrado por renovación en ese directorio.
- **Throne**: interesante para una expansión, pero no se fijó un inventario actual dentro de esta zona; no importar ubicaciones históricas por conveniencia. [Seguimiento local](https://dcpublicrestrooms.org/public-restroom-initiatives/new-dc-public-restroom-initiatives/).
- **Water Stations and Bathrooms de DC GIS**: capa asociada a MajorEvent; no asumir permanencia. [Metadatos](https://maps2.dcgis.dc.gov/dcgis/rest/services/DDOT/MajorEvent/FeatureServer/14).
- Hoteles, restaurantes y códigos compartidos en foros: no se tomó acceso ocasional como política pública, ni se recopilaron códigos de puertas.
- No se leyó ningún grupo privado de Facebook ni se contactó a personas.

## Fuentes transversales útiles

- [Smithsonian: admisión y pases](https://www.si.edu/visit/guidelines).
- [Smithsonian: sedes, direcciones y horarios](https://www.si.edu/visit/museums).
- [NPS: ubicaciones generales con baños](https://home.nps.gov/nama/learn/education/explore-on-your-own.htm).
- [DC Public Restrooms](https://dcpublicrestrooms.org/).
- [Lista comunitaria de Reddit](https://www.reddit.com/r/washingtondc/comments/1m796jt/dc_public_bathroom_master_list/).

Para fuentes HTML se consultó contenido web; para algunos PDF se utilizó texto indexado. No se inspeccionaron visualmente todos los planos: confirmar la posición exacta de los iconos antes de crear coordenadas o instrucciones interiores definitivas. Una fuente que enumera amenities no basta para inferir el camino accesible desde la calle.

## Protocolo de revisión de campo

Registrar fecha/hora, entrada usada, si se permitió acceso sin compra, si exigió pase/permiso, horario anunciado y recorrido al baño. Registrar comodidades observadas y cualquier barrera. Conservar cierre temporal como evento con fecha y evidencia. No fotografiar usuarios ni información privada. El resultado debe poder corregir un dato existente, no crear automáticamente otro pin.

La app debe mostrar «abierto según horario», «horario sin confirmar» o «cierre reportado», según corresponda. Ninguna de estas fuentes ofrece garantía en tiempo real de que una cabina esté libre.
