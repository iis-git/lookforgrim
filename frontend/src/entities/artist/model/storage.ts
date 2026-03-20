import type { ArtistPoint, Coordinates } from './types';

const ARTISTS_STORAGE_KEY = 'lookforgrim.artist.points';

export const createArtistId = (): string => {
  if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `artist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const toCoordinates = (value: unknown): Coordinates | null => {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const latitude = Number(value[0]);
  const longitude = Number(value[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
};

const toArtistPoint = (value: unknown): ArtistPoint | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<ArtistPoint> & { coordinates?: unknown };
  const coordinates = toCoordinates(candidate.coordinates);

  if (!coordinates) {
    return null;
  }

  return {
    id: typeof candidate.id === 'string' ? candidate.id : createArtistId(),
    name: typeof candidate.name === 'string' ? candidate.name : '',
    phone: typeof candidate.phone === 'string' ? candidate.phone : '',
    notes: typeof candidate.notes === 'string' ? candidate.notes : '',
    coordinates,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  };
};

export const readStoredArtists = (): ArtistPoint[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(ARTISTS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(toArtistPoint).filter((item): item is ArtistPoint => item !== null);
  } catch {
    window.localStorage.removeItem(ARTISTS_STORAGE_KEY);
    return [];
  }
};

export const writeStoredArtists = (artists: ArtistPoint[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ARTISTS_STORAGE_KEY, JSON.stringify(artists));
};
