# Migraciones de Supabase

La primera migración crea el modelo operativo de la etapa 1 e importa de forma idempotente `public.restrooms_seed` hacia `public.restrooms` y `public.restroom_sources`.

Se ejecuta desde el SQL Editor del proyecto Supabase **Baños app**. Antes de ejecutarla, confirmar que `restrooms_seed` sigue conteniendo los 30 IDs originales. Después de ejecutarla, usar las tres consultas de verificación al final del archivo SQL.

La migración no publica registros, no añade políticas públicas, no incluye credenciales y no asigna coordenadas. RLS queda habilitado en las tres tablas nuevas.

Para añadir la primera tanda de coordenadas, usar una migración posterior. Cada punto debe corresponder a una entrada revisada o permanecer `NULL`; no usar el centro de un edificio como si fuera la entrada.
