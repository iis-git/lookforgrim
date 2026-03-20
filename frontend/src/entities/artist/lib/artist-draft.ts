import type { ArtistDraft } from '../model/types';

export const createEmptyArtistDraft = (): ArtistDraft => ({
  name: '',
  phone: '',
  notes: '',
  coordinates: null,
});
