# Lookforgrim Frontend

Next.js frontend shell for the deployed backend API.

## What is implemented

- Login form connected to `POST /auth/login`
- Persisted auth session in browser `localStorage`
- Automatic refresh via `POST /auth/refresh` on `401`
- Profile check via `GET /auth/me`
- API health badge via `GET /health`

## Local start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`

## Environment variables

- `NEXT_PUBLIC_API_BASE_URL` (default: `https://api.lookforgrim.online/v1`)

## Production build

```bash
npm run build
npm run start
```
