# Coordenadas de entrada pendientes

La migración operativa no asignó coordenadas porque las direcciones del seed describen edificios, monumentos o referencias, no necesariamente puertas de acceso. Esto protege el comportamiento futuro del radar: un pin sin revisión no se presentará como destino confirmado.

La primera tanda debe revisar los IDs **1, 2, 9, 10, 11, 14, 15, 16, 19 y 22**. Para cada uno:

1. Registrar una URL de fuente o un enlace de mapa con la selección revisada en `geocode_source_url`.
2. Comprobar que latitud y longitud corresponden a Washington, DC y a la entrada indicada, no al centroide del lugar.
3. Usar `location_precision='entrance'` solo si el punto representa realmente una puerta o instalación exterior identificada. Usar `venue` o `landmark` para posiciones menos precisas y mantenerlas fuera de cualquier publicación o radar.
4. Guardar `geocoded_at`; `entrance_verified_at` se reserva para una revisión explícita de la entrada, no para una geocodificación textual.
5. Añadir o actualizar `restroom_sources` con el ámbito `location` y una nota breve sobre qué comprobó la fuente.

La información oficial revisada durante esta entrega confirma que el National Museum of Natural History sitúa su entrada en Madison Drive y su salida en 10th/Constitution, y que el National Museum of American History publica GPS `38.891239, -77.030198`; estos datos se dejaron documentados, pero no se cargaron como entradas definitivas sin una selección de puerta y revisión adicional. Fuentes: [Natural History](https://naturalhistory.si.edu/visit/getting-here-and-parking) y [American History](https://americanhistory.si.edu/fr/node/52?form=FUNPYRYGFFP).
