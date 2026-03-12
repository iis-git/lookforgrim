# Lookforgrim — MVP blueprint

## 1) Goal

Build an internal map-based service for assigning artists to incoming orders.

Core flow:
1. Manager receives an order in a district/metro area.
2. Opens map + filters.
3. Finds suitable nearby artist by skills, category, availability, and radius.

## 2) Confirmed scope (MVP)

- Frontend: Next.js + Yandex Maps.
- Backend: NestJS (Fastify adapter), REST API, separate subdomain.
- DB: PostgreSQL + PostGIS.
- Auth: email + password.
- Roles:
  - admin
  - operator (управляющий)
  - manager
  - makeup_artist
  - guest
- Public mode: not implemented in MVP (design only).
- Storage: local server filesystem for photos in MVP, behind `StorageService` abstraction for easy future switch to S3.
- Geography: Saint Petersburg + Leningrad region first.

## 3) Roles and permissions (MVP)

| Action | admin | operator | manager | makeup_artist | guest |
|---|---|---|---|---|---|
| Login to system | ✅ | ✅ | ✅ | ❌ (later) | ❌ |
| View map markers | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create/edit artists | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create/edit stationary points | ✅ | ✅ | ✅ | ❌ | ❌ |
| Change user roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete entities (soft delete) | ✅ | ✅ | ❌ | ❌ | ❌ |

Notes:
- `manager` can edit artist and point cards, but cannot change user roles.
- `operator` has near-full business/admin permissions.

## 4) Core domain model

## 4.1 User
- `id` (uuid)
- `email` (unique)
- `password_hash`
- `role` (enum)
- `is_active` (bool)
- timestamps

## 4.2 Artist
- `id` (uuid)
- `full_name`
- `phone_personal`
- `city` (for MVP mostly SPB/LO)
- `district`
- `metro_station`
- `location` (geography(Point, 4326))
- `work_radius_km` (int)
- `has_car` (bool)
- `category` (enum: premium/top/master/new)
- `services` (array enum)
- `languages` (array text)
- `visibility` (enum, default private_to_team)
- `notes` (text)
- `is_active` (bool)
- timestamps

## 4.3 ArtistAvailability
- `id` (uuid)
- `artist_id` (fk)
- `day_of_week` (0..6)
- `start_time`
- `end_time`
- `is_available` (bool)

## 4.4 StationaryPoint
- `id` (uuid)
- `name`
- `type` (enum: shop/rent/entertainment)
- `address`
- `city`
- `district`
- `metro_station`
- `location` (geography(Point, 4326))
- `working_hours` (jsonb)
- `phone`
- `description`
- `is_active` (bool)
- timestamps

## 4.5 MediaFile
- `id` (uuid)
- `owner_type` (artist/point)
- `owner_id`
- `storage_provider` (local now)
- `file_key` (relative path)
- `public_url`
- `mime_type`
- `size_bytes`
- timestamps

## 5) Search & matching rules

Primary matching in MVP:
1. Filter artists by selected criteria:
   - name query
   - district
   - city
   - metro
   - services
   - category
   - language
   - has_car
   - availability at date/time
2. Calculate straight-line distance to order point (`ST_DistanceSphere`/equivalent).
3. Keep artists where `distance_km <= work_radius_km`.
4. Sort by:
   1) distance ASC
   2) category weight DESC
   3) availability match DESC

## 6) REST API v1

## 6.1 Auth
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`

## 6.2 Users / roles
- `GET /v1/users?role=...`
- `PATCH /v1/users/:id/role`

## 6.3 Artists
- `POST /v1/artists`
- `GET /v1/artists`
- `GET /v1/artists/:id`
- `PATCH /v1/artists/:id`
- `DELETE /v1/artists/:id`
- `PATCH /v1/artists/:id/location`
- `PUT /v1/artists/:id/availability`
- `POST /v1/artists/:id/photos`

## 6.4 Stationary points
- `POST /v1/points`
- `GET /v1/points`
- `GET /v1/points/:id`
- `PATCH /v1/points/:id`
- `DELETE /v1/points/:id`
- `POST /v1/points/:id/photos`

## 6.5 Map and matching
- `GET /v1/map/markers` (with bbox + filters)
- `POST /v1/map/nearest-artists`

## 7) StorageService contract (important)

Interface (concept):

```ts
interface StorageService {
  upload(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder: string;
  }): Promise<{
    fileKey: string;
    publicUrl: string;
    sizeBytes: number;
  }>;

  delete(fileKey: string): Promise<void>;
}
```

Implementations:
- `LocalStorageService` (MVP)
- `S3StorageService` (future)

Switch by config only, without changing feature code.

## 8) Delivery phases

Phase 1 (backend skeleton + auth + RBAC):
- NestJS app scaffold
- DB + migrations
- users/auth modules
- role guards

Phase 2 (artists + points + media):
- CRUD + validation
- local file upload via StorageService

Phase 3 (map search + nearest):
- markers endpoint
- nearest-artists endpoint with distance/radius logic

Phase 4 (frontend first usable version):
- map page
- filters
- forms for artist/point
- role management page (simple)

## 9) Non-goals for MVP

- Public share links
- Artist self-service cabinet
- Route-time distance via roads (instead of direct distance)
- Billing/CRM features
