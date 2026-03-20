'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.scss';

type Coordinates = [number, number];
type MapLoadStatus = 'loading' | 'ready' | 'error';
type EditorMode = 'create' | 'edit';

type ArtistPoint = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  coordinates: Coordinates;
  updatedAt: string;
};

type ArtistDraft = {
  name: string;
  phone: string;
  notes: string;
  coordinates: Coordinates | null;
};

type YMapState = {
  center: Coordinates;
  zoom: number;
  controls?: string[];
};

type YMapEvent = {
  get: (name: string) => unknown;
};

type YMapEventsCollection = {
  add: (eventName: string, handler: (event: YMapEvent) => void) => void;
  remove: (eventName: string, handler: (event: YMapEvent) => void) => void;
};

type YPlacemarkInstance = {
  events: YMapEventsCollection;
};

type YMapInstance = {
  destroy: () => void;
  events: YMapEventsCollection;
  geoObjects: {
    add: (geoObject: YPlacemarkInstance) => void;
    remove: (geoObject: YPlacemarkInstance) => void;
  };
  setCenter?: (coordinates: Coordinates, zoom?: number, options?: Record<string, unknown>) => void;
  container?: {
    fitToViewport?: () => void;
  };
};

type YMapsNamespace = {
  ready: (callback: () => void) => void;
  Map: new (container: HTMLElement, state: YMapState, options?: Record<string, unknown>) => YMapInstance;
  Placemark: new (
    coordinates: Coordinates,
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YPlacemarkInstance;
};

type PlacemarkRef = {
  id: string;
  instance: YPlacemarkInstance;
  clickHandler: (event: YMapEvent) => void;
};

declare global {
  interface Window {
    ymaps?: YMapsNamespace;
  }
}

const MAP_SCRIPT_ID = 'lookforgrim-yandex-maps-script';
const ARTISTS_STORAGE_KEY = 'lookforgrim.artist.points';
const DEFAULT_CENTER: Coordinates = [55.751244, 37.618423];
const DEFAULT_ZOOM = 10;
const DEFAULT_YANDEX_MAPS_API_KEY = 'ed792bc6-fd33-414a-91f2-58a64b6677dd';

function createYandexMapsScriptSrc(): string {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || DEFAULT_YANDEX_MAPS_API_KEY;
  const baseUrl = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
  return `${baseUrl}&apikey=${encodeURIComponent(apiKey)}`;
}

function createArtistId(): string {
  if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `artist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toCoordinates(value: unknown): Coordinates | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const latitude = Number(value[0]);
  const longitude = Number(value[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
}

function formatCoordinates(value: Coordinates): string {
  return `${value[0].toFixed(5)}, ${value[1].toFixed(5)}`;
}

function readStoredArtists(): ArtistPoint[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(ARTISTS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as Partial<ArtistPoint> & { coordinates?: unknown };
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
      })
      .filter((item): item is ArtistPoint => item !== null);
  } catch {
    return [];
  }
}

export default function HomePage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YMapInstance | null>(null);
  const mapClickHandlerRef = useRef<((event: YMapEvent) => void) | null>(null);
  const placemarkRefs = useRef<PlacemarkRef[]>([]);

  const [mapStatus, setMapStatus] = useState<MapLoadStatus>('loading');
  const [artists, setArtists] = useState<ArtistPoint[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [activeArtistId, setActiveArtistId] = useState<string | null>(null);
  const [hintText, setHintText] = useState('Нажми на карту, чтобы добавить нового гримера.');
  const [draft, setDraft] = useState<ArtistDraft>({
    name: '',
    phone: '',
    notes: '',
    coordinates: null,
  });

  const activeArtistUpdatedAt = useMemo(() => {
    if (!activeArtistId) {
      return null;
    }

    const target = artists.find((artist) => artist.id === activeArtistId);

    if (!target) {
      return null;
    }

    const parsedDate = new Date(target.updatedAt);

    if (Number.isNaN(parsedDate.getTime())) {
      return target.updatedAt;
    }

    return parsedDate.toLocaleString('ru-RU');
  }, [artists, activeArtistId]);

  const canSave = Boolean(draft.coordinates && draft.name.trim());

  useEffect(() => {
    setArtists(readStoredArtists());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(ARTISTS_STORAGE_KEY, JSON.stringify(artists));
  }, [artists]);

  function selectArtistForEditing(artist: ArtistPoint): void {
    setEditorMode('edit');
    setActiveArtistId(artist.id);
    setHintText(`Редактирование: ${artist.name || 'без имени'}`);
    setDraft({
      name: artist.name,
      phone: artist.phone,
      notes: artist.notes,
      coordinates: artist.coordinates,
    });

    mapInstanceRef.current?.setCenter?.(artist.coordinates, 13, { duration: 220 });
  }

  function prepareNewPointMode(): void {
    setEditorMode('create');
    setActiveArtistId(null);
    setHintText('Нажми по карте, чтобы выбрать координаты новой точки.');
    setDraft({
      name: '',
      phone: '',
      notes: '',
      coordinates: null,
    });
  }

  function saveArtist(event: FormEvent<HTMLFormElement>): void {
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

    mapInstanceRef.current?.setCenter?.(newArtist.coordinates, 13, { duration: 220 });
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }

    let cancelled = false;

    const initMap = (): void => {
      if (cancelled || mapInstanceRef.current || !mapContainerRef.current) {
        return;
      }

      const ymaps = window.ymaps;

      if (!ymaps) {
        setMapStatus('error');
        return;
      }

      ymaps.ready(() => {
        if (cancelled || mapInstanceRef.current || !mapContainerRef.current) {
          return;
        }

        try {
          const map = new ymaps.Map(
            mapContainerRef.current,
            {
              center: DEFAULT_CENTER,
              zoom: DEFAULT_ZOOM,
              controls: ['zoomControl', 'geolocationControl'],
            },
            {
              suppressMapOpenBlock: true,
            },
          );

          const clickHandler = (event: YMapEvent) => {
            const coordinates = toCoordinates(event.get('coords'));

            if (!coordinates) {
              return;
            }

            setEditorMode('create');
            setActiveArtistId(null);
            setHintText('Координаты выбраны. Заполни карточку и нажми «Добавить точку».');
            setDraft({
              name: '',
              phone: '',
              notes: '',
              coordinates,
            });
          };

          map.events.add('click', clickHandler);
          mapClickHandlerRef.current = clickHandler;
          mapInstanceRef.current = map;
          setMapStatus('ready');
        } catch {
          setMapStatus('error');
        }
      });
    };

    const onScriptError = (): void => {
      if (!cancelled) {
        setMapStatus('error');
      }
    };

    const existingScript = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');

    if (!existingScript) {
      script.id = MAP_SCRIPT_ID;
      script.src = createYandexMapsScriptSrc();
      script.async = true;
      document.head.append(script);
    }

    if (window.ymaps) {
      initMap();
    } else {
      script.addEventListener('load', initMap);
      script.addEventListener('error', onScriptError);
    }

    const onResize = (): void => {
      mapInstanceRef.current?.container?.fitToViewport?.();
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      script.removeEventListener('load', initMap);
      script.removeEventListener('error', onScriptError);

      const map = mapInstanceRef.current;

      if (map && mapClickHandlerRef.current) {
        map.events.remove('click', mapClickHandlerRef.current);
      }

      for (const placemarkRef of placemarkRefs.current) {
        placemarkRef.instance.events.remove('click', placemarkRef.clickHandler);
        map?.geoObjects.remove(placemarkRef.instance);
      }

      placemarkRefs.current = [];
      mapClickHandlerRef.current = null;
      map?.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const ymaps = window.ymaps;

    if (!map || !ymaps) {
      return;
    }

    for (const placemarkRef of placemarkRefs.current) {
      placemarkRef.instance.events.remove('click', placemarkRef.clickHandler);
      map.geoObjects.remove(placemarkRef.instance);
    }

    placemarkRefs.current = [];

    for (const artist of artists) {
      const placemark = new ymaps.Placemark(
        artist.coordinates,
        {
          hintContent: artist.name || 'Гример',
          balloonContentHeader: artist.name || 'Гример',
          balloonContentBody: artist.phone ? `Телефон: ${artist.phone}` : 'Телефон не указан',
          balloonContentFooter: formatCoordinates(artist.coordinates),
        },
        {
          preset: activeArtistId === artist.id ? 'islands#blueStretchyIcon' : 'islands#blueDotIcon',
        },
      );

      const clickHandler = () => {
        selectArtistForEditing(artist);
      };

      placemark.events.add('click', clickHandler);
      map.geoObjects.add(placemark);

      placemarkRefs.current.push({
        id: artist.id,
        instance: placemark,
        clickHandler,
      });
    }
  }, [artists, activeArtistId, mapStatus]);

  return (
    <main className={styles.mapPage}>
      <div className={`${styles.glow} ${styles.glowTop}`} aria-hidden="true" />
      <div className={`${styles.glow} ${styles.glowBottom}`} aria-hidden="true" />

      <section className={styles.mapShell}>
        <div className={styles.mapHeading}>
          <h1 className={styles.brand}>Lookforgrim</h1>
        </div>

        <div className={styles.mapGrid}>
          <div className={styles.mapFrame}>
            <div ref={mapContainerRef} className={styles.mapCanvas} />
          </div>

          <aside className={styles.controlPanel}>
            <div className={styles.panelHead}>
              <p className={styles.panelTitle}>Гримеры</p>
              <span className={styles.panelCount}>{artists.length}</span>
            </div>

            <p className={styles.panelHint}>{hintText}</p>

            <div className={styles.pointList}>
              {artists.length === 0 ? (
                <p className={styles.emptyState}>Пока нет точек. Кликни по карте, чтобы создать первую.</p>
              ) : (
                artists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    className={`${styles.pointCard} ${activeArtistId === artist.id ? styles.pointCardActive : ''}`.trim()}
                    onClick={() => selectArtistForEditing(artist)}
                  >
                    <strong className={styles.pointCardName}>{artist.name || 'Без имени'}</strong>
                    <span className={styles.pointCardMeta}>{artist.phone || 'Телефон не указан'}</span>
                    <span className={styles.pointCardMeta}>{formatCoordinates(artist.coordinates)}</span>
                  </button>
                ))
              )}
            </div>

            <form className={styles.editorForm} onSubmit={saveArtist}>
              <p className={styles.editorTitle}>{editorMode === 'edit' ? 'Редактирование точки' : 'Новая точка'}</p>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Имя гримера</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Например, Анна Петрова"
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Телефон</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={draft.phone}
                  onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+7 (900) 000-00-00"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Координаты</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={draft.coordinates ? formatCoordinates(draft.coordinates) : ''}
                  placeholder="Кликни по карте для выбора"
                  readOnly
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Комментарий</span>
                <textarea
                  className={styles.fieldTextarea}
                  rows={3}
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Особенности работы, район, выезд и т.д."
                />
              </label>

              {activeArtistUpdatedAt ? <p className={styles.editorMeta}>Обновлено: {activeArtistUpdatedAt}</p> : null}

              <div className={styles.editorActions}>
                <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={!canSave}>
                  {editorMode === 'edit' ? 'Сохранить изменения' : 'Добавить точку'}
                </button>
                <button className={`${styles.button} ${styles.buttonGhost}`} type="button" onClick={prepareNewPointMode}>
                  Новая точка
                </button>
              </div>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
