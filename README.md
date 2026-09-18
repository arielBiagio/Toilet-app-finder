# Baño Radar DC

Una aplicación móvil para encontrar baños públicos en National Mall y downtown Washington, DC.

Baño Radar combina un mapa interactivo con filtros de acceso y un modo de emergencia pensado para esos momentos en los que importa encontrar la opción válida más cercana lo antes posible.

## Cómo funciona

La aplicación tiene tres pantallas principales:

- **Explorar:** muestra el mapa, permite usar la ubicación del dispositivo, aplicar filtros y consultar resultados cercanos.
- **Favoritos:** guarda lugares útiles en el navegador para encontrarlos rápidamente.
- **Perfil:** reúne preferencias locales, progreso y badges de la experiencia.

El botón **SOS** transforma el mapa en un radar de urgencia. En ese modo se ignoran puntuaciones y preferencias secundarias para priorizar distancia, acceso permitido, estado operativo y disponibilidad.

## Estado del proyecto

El proyecto está en desarrollo. La interfaz móvil, el mapa, el radar, los favoritos locales, el perfil y la PWA ya funcionan.

Existe un catálogo inicial de 30 ubicaciones candidatas, pero todavía se están verificando sus entradas, coordenadas, acceso y horarios. Por esa razón la aplicación no presenta esos registros como recomendaciones públicas hasta que tengan evidencia suficiente.

## Tecnologías

- React y TypeScript
- Vite
- MapLibre GL JS y MapTiler
- Supabase
- Vite PWA y Workbox

## Ejecutar localmente

```bash
npm install
```

Copia `.env.example` como `.env.local` y configura una clave pública de MapTiler:

```text
VITE_MAPTILER_KEY=tu_clave_publica
```

Para probar la cuenta opcional y las contribuciones, aplica las migraciones de `supabase/migrations/` y añade la clave publicable del proyecto:

```text
VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publicable
```

Después inicia el servidor:

```bash
npm run dev
```

Para verificar la versión de producción:

```bash
npm run check
npm run build
npm run preview
```

## Privacidad y funcionamiento sin conexión

La ubicación se solicita únicamente cuando el usuario pulsa el botón correspondiente y no se conserva como historial. Los favoritos y preferencias se guardan en el navegador. La PWA almacena la interfaz de la aplicación, pero no guarda mapas ni rutas de terceros para navegación sin conexión.

## Alcance inicial

La primera versión cubre National Mall y downtown Washington, DC. El objetivo inmediato es publicar un catálogo pequeño pero confiable antes de ampliar la zona o añadir contribuciones comunitarias.

La documentación técnica y el estado de validación se encuentran en [`docs/`](docs/README_DESARROLLO.md).
