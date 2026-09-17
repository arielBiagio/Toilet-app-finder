# App de baños — National Mall y downtown DC

Proyecto para implementar una PWA con mapa, favoritos, perfil y modo urgencia tipo radar. Investigación inicial: **17 de septiembre de 2026**.

## Estado actual

- Proyecto Supabase: **Baños app**, referencia `modtdxajnwaesgxjbekw`.
- URL del servicio: https://modtdxajnwaesgxjbekw.supabase.co
- [Tabla creada: public.restrooms_seed](https://supabase.com/dashboard/project/modtdxajnwaesgxjbekw/editor/17579?schema=public).
- Se cargaron **30 registros**, con clave primaria `id`, 14 columnas y Row Level Security activado. No se crearon políticas públicas.
- Distribución: **20 National Mall / 10 downtown**. Evidencia: **25 oficial/institucional, 2 comunitaria y 3 establecimientos pendientes de confirmar baños**.
- Todos los registros están en `draft`. No son 30 baños verificados presencialmente, ni una promesa de disponibilidad actual. Hay direcciones de edificios y referencias de parques; todavía no hay coordenadas de entrada.
- La app implementa las etapas 0–4: pantalla Explorar con MapLibre, modo urgencia, favoritos y preferencias locales, y el shell instalable PWA.
- La primera parte de la etapa 1 está aplicada: `restrooms`, `restroom_sources` y `restroom_schedule_exceptions` existen con RLS, sin políticas públicas. Se importaron 30 borradores y 60 fuentes sin asignar coordenadas ni publicar ubicaciones.
- El service worker solo precachea recursos generados por la aplicación. No almacena mapas de MapTiler, rutas ni historial de ubicaciones. Mientras no haya catálogo publicado, la vista de datos sin conexión indica que no existe copia local.
- Las coordenadas de entrada, la lectura pública, las cuentas y las fichas reales de favoritos siguen pendientes.

## Ejecutar la aplicación

1. Copiar `.env.example` a `.env.local` si se necesita configurar servicios en una etapa futura. No añadir una clave `service_role` ni secretos del proveedor de mapas.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev` para desarrollo local y abrir la URL que muestra Vite, normalmente `http://localhost:5173/`.
4. No abrir `index.html` con doble clic ni mediante una dirección `file:///...`: el navegador bloqueará el módulo `src/main.tsx` por seguridad. Para probar una compilación, ejecutar `npm run build` y después `npm run preview`.

Para visualizar el mapa base en la etapa 2, configurar una clave pública de MapTiler en `.env.local`:

```text
VITE_MAPTILER_KEY=tu_clave_publica
```

La interfaz sigue funcionando sin esa clave y muestra el motivo en lugar del mapa. No añadir una clave secreta ni `service_role`.

La PWA se registra al compilar y puede instalarse desde un navegador compatible. El service worker se genera durante `npm run build`; en desarrollo se prioriza la recarga rápida de Vite.

El arranque inicial es deliberadamente informativo: muestra el alcance y que el catálogo sigue en revisión. No usa `restrooms_seed` desde el navegador porque esa tabla no tiene política de lectura pública y no contiene ubicaciones listas para recomendar.

## Documentos

1. [Plan de implementación](PLAN_PARA_IA.md): ejecutar por etapas y criterios de aceptación.
2. [Datos y Supabase](docs/DATOS_Y_SUPABASE.md): esquema existente, significado de campos y esquema futuro.
3. [Verificación y fuentes](docs/VERIFICACION_Y_FUENTES.md): limitaciones concretas y trabajo pendiente de investigación.
4. [Catálogo legible](data/CATALOGO.md): las 30 ubicaciones con direcciones y enlaces.
5. [Copia local de los datos](data/restrooms_seed.json): respaldo de la carga inicial; no incluye secretos.
6. [Estado y comprobaciones](docs/ESTADO.md): qué se hizo y qué debe comprobar la siguiente IA.

## Mensaje para la próxima IA

> Continúa este proyecto leyendo README.md, PLAN_PARA_IA.md, docs/DATOS_Y_SUPABASE.md y docs/ESTADO.md. La tabla public.restrooms_seed ya existe en el proyecto Supabase modtdxajnwaesgxjbekw y contiene 30 registros; la migración operativa `supabase/migrations/202609170001_create_operational_restrooms.sql` ya se aplicó. `restrooms` tiene 30 borradores y `restroom_sources` 60 fuentes, con RLS habilitado y cero políticas públicas. Sigue con la validación de coordenadas de entrada y la etapa 5 solo después de contar con filas publicables; no publiques ni inventes coordenadas, reseñas ni horarios. Mantén el modo urgencia independiente de ratings. No introduzcas caché de MapTiler, rutas ni historial de ubicación. Documenta avances y pruebas en docs/ESTADO.md al terminar cada etapa. Usa el stack definido y deja IA dentro de la app fuera del MVP.

La autorización de esta entrega fue investigar, cargar la base inicial y preparar el plan. El mensaje anterior es una propuesta para que el usuario encargue la implementación a la próxima IA; no constituye autorización automática para publicar o contratar servicios.
