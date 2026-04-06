# vue3-rco-notifications (vue3-atlas)

RCO Notifications application - a remake of atlas.phila.gov using Vue 3. This project powers both atlas.phila.gov and cityatlas.phila.gov, controlled by the `VITE_VERSION` environment variable.

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite 5
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Internationalization**: Vue I18n 9
- **CSS Framework**: Bulma
- **Mapping**: MapLibre GL
- **Geospatial**: Turf.js (area, bbox, buffer, distance, etc.)
- **HTTP Client**: Axios
- **Date Handling**: date-fns, date-fns-tz
- **UI Components**: @phila/phila-ui-* packages

## Development Commands

```sh
npm install        # Install dependencies
npm run dev        # Development server (DO NOT run for Andy)
npm run prod       # Production mode dev server (DO NOT run for Andy)
npm run build      # Build for production
npm run build-dev  # Build for development
npm run build-prod # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run lint:fix   # Run ESLint with auto-fix
```

**Do NOT run dev servers for Andy - he runs them himself.**

## Environment Variables

Key variables in `.env.local`:
- `VITE_PUBLICPATH=/` - for accessing images in public folder
- `VITE_DEBUG=true` - enables console.logs in dev
- `VITE_VERSION=atlas` or `cityatlas` - switches between app versions

See internal documentation for protected service credentials.

## Requirements

- Node 20.x
- npm 10.x

## Related Projects

- [vue3-atlas wiki](https://github.com/CityOfPhiladelphia/vue3-atlas/wiki)
- @phila/phila-ui-* component packages
