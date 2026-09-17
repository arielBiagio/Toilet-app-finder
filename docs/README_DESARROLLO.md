# Estado técnico y traspaso del proyecto

Este documento conserva la información interna de desarrollo que antes estaba en el README público.

## Estado actual

- Proyecto Supabase: **Baños app**, referencia `modtdxajnwaesgxjbekw`.
- Se prepararon 30 ubicaciones candidatas: 20 en National Mall y 10 en downtown Washington, DC.
- Todos los registros permanecen en `draft`. Todavía no representan baños verificados presencialmente ni una promesa de disponibilidad actual.
- Las tablas operativas `restrooms`, `restroom_sources` y `restroom_schedule_exceptions` existen con RLS habilitado y sin políticas públicas.
- La aplicación implementa mapa, filtros, modo urgencia, favoritos y preferencias locales, perfil y shell PWA.
- El service worker almacena únicamente recursos propios de la interfaz. No guarda mapas de MapTiler, rutas ni historial de ubicación.
- Siguen pendientes las coordenadas de entrada revisadas, la lectura pública y las fichas reales conectadas a Supabase.

## Ejecución local

1. Copiar `.env.example` a `.env.local`.
2. Añadir una clave pública y restringida de MapTiler como `VITE_MAPTILER_KEY`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev` y abrir la URL indicada por Vite.

No abrir `index.html` mediante `file:///`: los módulos del proyecto necesitan el servidor de Vite.

## Documentos de trabajo

- [Plan de implementación](../PLAN_PARA_IA.md)
- [Datos y Supabase](DATOS_Y_SUPABASE.md)
- [Verificación y fuentes](VERIFICACION_Y_FUENTES.md)
- [Coordenadas pendientes](COORDENADAS_PENDIENTES.md)
- [Estado y comprobaciones](ESTADO.md)
- [Catálogo investigado](../data/CATALOGO.md)

## Continuación recomendada

Validar coordenadas de entrada y acceso antes de publicar registros. No usar el centro de un edificio como si fuera una entrada ni convertir horarios del establecimiento en horarios confirmados del baño. Mantener el modo urgencia independiente de ratings y publicar únicamente ubicaciones con evidencia suficiente.
