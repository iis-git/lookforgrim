import { type FormEvent, useEffect, useMemo, useState } from 'react';

import {
  type ArtistDraft,
  type ArtistPoint,
  type Coordinates,
  type EditorMode,
  createArtistId,
  createEmptyArtistDraft,
  formatUpdatedAt,
  readStoredArtists,
  writeStoredArtists,
} from '@/entities/artist';

type UseArtistManagementResult = {
  artists: ArtistPoint[];
  editorMode: EditorMode;
  activeArtistId: string | null;
  hintText: string;
  draft: ArtistDraft;
  activeArtistUpdatedAt: string | null;
  canSave: boolean;
  setDraftField: <K extends keyof ArtistDraft>(field: K, value: ArtistDraft[K]) => void;
  saveArtist: (event: FormEvent<HTMLFormElement>) => void;
  prepareNewPointMode: () => void;
  selectArtistForEditing: (artist: ArtistPoint) => void;
  selectCoordinatesForNewPoint: (coordinates: Coordinates) => void;
};

const DEFAULT_HINT_TEXT = 'Нажми на карту, чтобы добавить нового гримера.';

export const useArtistManagement = (): UseArtistManagementResult => {
  const [artists, setArtists] = useState<ArtistPoint[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [activeArtistId, setActiveArtistId] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string>(DEFAULT_HINT_TEXT);
  const [draft, setDraft] = useState<ArtistDraft>(createEmptyArtistDraft());

  useEffect(() => {
    setArtists(readStoredArtists());
  }, []);

  useEffect(() => {
    writeStoredArtists(artists);
  }, [artists]);

  const activeArtistUpdatedAt = useMemo(() => {
    if (!activeArtistId) {
      return null;
    }

    const activeArtist = artists.find((artist) => artist.id === activeArtistId);

    if (!activeArtist) {
      return null;
    }

    return formatUpdatedAt(activeArtist.updatedAt);
  }, [artists, activeArtistId]);

  const canSave = Boolean(draft.coordinates && draft.name.trim());

  const setDraftField = <K extends keyof ArtistDraft>(field: K, value: ArtistDraft[K]): void => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const prepareNewPointMode = (): void => {
    setEditorMode('create');
    setActiveArtistId(null);
    setHintText('Нажми по карте, чтобы выбрать координаты новой точки.');
    setDraft(createEmptyArtistDraft());
  };

  const selectArtistForEditing = (artist: ArtistPoint): void => {
    setEditorMode('edit');
    setActiveArtistId(artist.id);
    setHintText(`Редактирование: ${artist.name || 'без имени'}`);
    setDraft({
      name: artist.name,
      phone: artist.phone,
      notes: artist.notes,
      coordinates: artist.coordinates,
    });
  };

  const selectCoordinatesForNewPoint = (coordinates: Coordinates): void => {
    setEditorMode('create');
    setActiveArtistId(null);
    setHintText('Координаты выбраны. Заполни карточку и нажми «Добавить точку».');
    setDraft({
      ...createEmptyArtistDraft(),
      coordinates,
    });
  };

  const saveArtist = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const coordinates = draft.coordinates;

    if (!coordinates) {
      setHintText('Сначала выбери координаты кликом по карте.');
      return;
    }

    const name = draft.name.trim();

    if (!name) {
      setHintText('Имя гримера обязательно.');
      return;
    }

    const updatedAt = new Date().toISOString();

    if (editorMode === 'edit' && activeArtistId) {
      setArtists((current) =>
        current.map((artist) =>
          artist.id === activeArtistId
            ? {
                ...artist,
                name,
                phone: draft.phone.trim(),
                notes: draft.notes.trim(),
                coordinates,
                updatedAt,
              }
            : artist,
        ),
      );
      setHintText('Изменения сохранены.');
      return;
    }

    const newArtist: ArtistPoint = {
      id: createArtistId(),
      name,
      phone: draft.phone.trim(),
      notes: draft.notes.trim(),
      coordinates,
      updatedAt,
    };

    setArtists((current) => [newArtist, ...current]);
    setEditorMode('edit');
    setActiveArtistId(newArtist.id);
    setHintText('Точка добавлена.');
    setDraft({
      name: newArtist.name,
      phone: newArtist.phone,
      notes: newArtist.notes,
      coordinates: newArtist.coordinates,
    });
  };

  return {
    artists,
    editorMode,
    activeArtistId,
    hintText,
    draft,
    activeArtistUpdatedAt,
    canSave,
    setDraftField,
    saveArtist,
    prepareNewPointMode,
    selectArtistForEditing,
    selectCoordinatesForNewPoint,
  };
};
