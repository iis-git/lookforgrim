# Lookforgrim Backend API v1

Base URL prefix: `/v1`

## Auth
- `POST /auth/setup-admin`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Users
- `GET /users`
- `PATCH /users/:id/role`

## Artists
- `POST /artists`
- `GET /artists`
- `GET /artists/:id`
- `PATCH /artists/:id`
- `PATCH /artists/:id/location`
- `PUT /artists/:id/availability`
- `DELETE /artists/:id`
- `POST /artists/:id/photos`
- `GET /artists/:id/photos`
- `DELETE /artists/:id/photos/:mediaId`

## Points
- `POST /points`
- `GET /points`
- `GET /points/:id`
- `PATCH /points/:id`
- `PATCH /points/:id/location`
- `DELETE /points/:id`
- `POST /points/:id/photos`
- `GET /points/:id/photos`
- `DELETE /points/:id/photos/:mediaId`

## Map
- `GET /map/markers`
- `POST /map/nearest-artists`

### Map filters
- `GET /map/markers` supports optional filters:
  - area: `minLat`, `minLng`, `maxLat`, `maxLng`
  - text/location: `q`, `city`, `district`, `metroStation`
  - artist traits: `category[]`, `services[]`, `languages[]`, `hasCar`
  - include toggles: `includeArtists`, `includePoints`
  - pagination: `limit`
- `POST /map/nearest-artists` supports optional filters:
  - target: either `pointId` OR `{ latitude, longitude }`
  - text/location: `q`, `city`, `district`, `metroStation`
  - artist traits: `category[]`, `services[]`, `languages[]`, `hasCar`
  - availability context: `dayOfWeek + time` OR `orderDateTime`
  - pagination: `limit`

## Health
- `GET /health`

## Notes
- Photo upload endpoint payload type: `multipart/form-data` with single file field.
- Photo uploads use local storage in MVP through `StorageService` abstraction.
- Responses are role-protected with JWT where required.
- Geospatial queries rely on PostgreSQL + PostGIS.
