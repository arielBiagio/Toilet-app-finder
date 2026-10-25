# DC Restroom Radar

A mobile-first web app for finding public restrooms around the National Mall and downtown Washington, DC.

DC Restroom Radar combines an interactive map, practical access filters, saved places, and a one-tap SOS mode designed to reduce the time between opening the app and choosing where to go.

## Features

### Explore

- Browse restroom locations on an interactive MapLibre map.
- Use device location or enter coordinates manually.
- Sort results by straight-line distance.
- Filter by known hours, purchase requirements, and wheelchair access.
- Select map markers to view the address, access policy, venue hours, entrance notes, amenities, and walking directions.
- Collapse the results sheet to create more room for the map.

### SOS quick route

SOS mode focuses the interface on making a fast decision:

- Requests the user's location when activated.
- Never displays estimated distances without a valid origin.
- Highlights the three closest eligible restrooms with numbered markers.
- Frames the user and the three destinations together on the map.
- Presents one primary recommendation with a direct **Go to the closest** action.
- Keeps two alternatives available in case the first option is unavailable.
- Supports an accessibility-only preference and manual coordinates as a fallback.
- Restores the previous map view when SOS mode is closed.

The current ranking uses Haversine distance. Walking-time routing may replace it in a later version.

### Favorites and profile

- Save useful restrooms locally in the browser.
- Open saved places directly on the map.
- Keep accessibility preferences between sessions.
- Optionally sign in through Supabase for community features and synchronized progress.
- View contribution statistics and achievement badges in the profile screen.

### Progressive Web App

The project includes a web app manifest and service worker through Vite PWA. The application shell can be cached, while third-party map tiles, routes, and location history are excluded from runtime caching.

## Data status

The initial catalog contains 30 practice locations across the National Mall and downtown DC. They are published in Supabase so the complete application flow can be tested, but they have not all been verified in person.

Addresses, entrance coordinates, access rules, restroom-specific hours, and amenities should be checked before treating the catalog as production-ready. The app uses the published Supabase catalog when available and falls back to a bundled local catalog if the request fails or takes too long.

## Tech stack

- React 19
- TypeScript
- Vite
- MapLibre GL JS
- MapTiler raster maps
- Supabase Database and Auth
- Vite PWA and Workbox

## Run locally

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local` and configure the public frontend values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_MAPTILER_KEY=your_public_maptiler_key
```

Restrict the MapTiler key to the origins used by the app. For local development, this normally includes URLs such as `http://localhost:5173` and the LAN address used for phone testing.

Start the development server:

```bash
npm run dev
```

To make Vite available to another device on the same network, use the network URL printed by the terminal. The project is configured to listen on all local interfaces.

Do not open `index.html` directly with a `file://` URL. Vite must serve the TypeScript modules.

## Validation commands

```bash
npm run check
npm run build
npm run preview
```

## Supabase setup

Versioned SQL migrations live in [`supabase/migrations`](supabase/migrations). They cover the restroom catalog, publication of the practice dataset, optional profiles, synchronized favorites, reviews, reports, contribution progress, and badges.

Use only the public project URL and publishable key in the frontend. Service-role keys and other secrets must never be added to `.env.local` values intended for the browser or committed to the repository.

## Privacy

Location is requested only after a user action, such as pressing the location or SOS button. It is used in memory to order nearby results and is not stored as location history. Local favorites and preferences remain in the browser unless the user enables the optional account features.

## Project scope

This is a learning project focused on mobile frontend development, mapping, Supabase, progressive web apps, and AI-assisted engineering workflows. The first geographic scope is the National Mall and downtown Washington, DC.

Internal implementation notes, validation status, and future stages remain in the [`docs`](docs/README_DESARROLLO.md) directory.
