import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import type { ArtistPoint } from '@/entities/artist';
import { formatCoordinates, toCoordinates } from '@/entities/artist';
import type { Coordinates } from '@/shared/types';
import {
  type MapLoadStatus,
  type YMapEvent,
  type YMapInstance,
  type YPlacemarkInstance,
  ensureYandexMapsScript,
} from '@/shared/lib/yandex-maps';

type PlacemarkRef = {
  instance: YPlacemarkInstance;
  clickHandler: (event: YMapEvent) => void;
};

type UseYandexMapOptions = {
  artists: ArtistPoint[];
  activeArtistId: string | null;
  onMapClick: (coordinates: Coordinates) => void;
  onArtistClick: (artist: ArtistPoint) => void;
};

type UseYandexMapResult = {
  mapContainerRef: RefObject<HTMLDivElement>;
  mapStatus: MapLoadStatus;
};

const DEFAULT_CENTER: Coordinates = [55.751244, 37.618423];
const DEFAULT_ZOOM = 10;

const clearPlacemarks = (map: YMapInstance | null, placemarkRefs: PlacemarkRef[]): void => {
  for (const placemarkRef of placemarkRefs) {
    placemarkRef.instance.events.remove('click', placemarkRef.clickHandler);
    map?.geoObjects.remove(placemarkRef.instance);
  }
};

export const useYandexMap = ({
  artists,
  activeArtistId,
  onMapClick,
  onArtistClick,
}: UseYandexMapOptions): UseYandexMapResult => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YMapInstance | null>(null);
  const mapClickHandlerRef = useRef<((event: YMapEvent) => void) | null>(null);
  const placemarkRefs = useRef<PlacemarkRef[]>([]);
  const onMapClickRef = useRef(onMapClick);
  const onArtistClickRef = useRef(onArtistClick);

  const [mapStatus, setMapStatus] = useState<MapLoadStatus>('loading');

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onArtistClickRef.current = onArtistClick;
  }, [onArtistClick]);

  const activeArtistCoordinates = useMemo(() => {
    if (!activeArtistId) {
      return null;
    }

    const activeArtist = artists.find((artist) => artist.id === activeArtistId);

    return activeArtist ? activeArtist.coordinates : null;
  }, [artists, activeArtistId]);

  useEffect(() => {
    if (!activeArtistCoordinates) {
      return;
    }

    mapInstanceRef.current?.setCenter?.(activeArtistCoordinates, 13, { duration: 220 });
  }, [activeArtistCoordinates]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }

    let isCancelled = false;

    const initMap = (): void => {
      if (isCancelled || mapInstanceRef.current || !mapContainerRef.current) {
        return;
      }

      const ymaps = window.ymaps;

      if (!ymaps) {
        setMapStatus('error');
        return;
      }

      ymaps.ready(() => {
        if (isCancelled || mapInstanceRef.current || !mapContainerRef.current) {
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

          const clickHandler = (event: YMapEvent): void => {
            const coordinates = toCoordinates(event.get('coords'));

            if (!coordinates) {
              return;
            }

            onMapClickRef.current(coordinates);
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
      if (!isCancelled) {
        setMapStatus('error');
      }
    };

    const script = ensureYandexMapsScript();

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
      isCancelled = true;
      window.removeEventListener('resize', onResize);
      script.removeEventListener('load', initMap);
      script.removeEventListener('error', onScriptError);

      const map = mapInstanceRef.current;

      if (map && mapClickHandlerRef.current) {
        map.events.remove('click', mapClickHandlerRef.current);
      }

      clearPlacemarks(map, placemarkRefs.current);
      placemarkRefs.current = [];
      mapClickHandlerRef.current = null;
      map?.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const ymaps = window.ymaps;

    if (!map || !ymaps || mapStatus !== 'ready') {
      return;
    }

    clearPlacemarks(map, placemarkRefs.current);
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

      const clickHandler = (_event: YMapEvent): void => {
        onArtistClickRef.current(artist);
      };

      placemark.events.add('click', clickHandler);
      map.geoObjects.add(placemark);

      placemarkRefs.current.push({
        instance: placemark,
        clickHandler,
      });
    }
  }, [artists, activeArtistId, mapStatus]);

  return {
    mapContainerRef,
    mapStatus,
  };
};
