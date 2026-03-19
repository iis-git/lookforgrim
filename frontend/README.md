# Lookforgrim Frontend

Next.js MVP for searching makeup artists on a map.

## What is implemented

- Main page with Yandex Maps integration
- No auth and roles for MVP stage
- Create new artist point by clicking on map
- View and edit existing points in side panel
- Local persistence in browser `localStorage`
- Neumorphism visual style for the shell layout
- Responsive map viewport for desktop and mobile

## Local start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Ensure `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` is present in `.env.local` (example already contains the current key).
4. Run dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`

## Environment variables

- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`

## Production build

```bash
npm run build
npm run start
```
