import type { Coordinates } from '@/shared/types';

export type { Coordinates };

export type ArtistPoint = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  coordinates: Coordinates;
  updatedAt: string;
};

export type ArtistDraft = {
  name: string;
  phone: string;
  notes: string;
  coordinates: Coordinates | null;
};

export type EditorMode = 'create' | 'edit';
