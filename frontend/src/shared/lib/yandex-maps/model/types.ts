import type { Coordinates } from '@/shared/types';

export type MapLoadStatus = 'loading' | 'ready' | 'error';

export type YMapState = {
  center: Coordinates;
  zoom: number;
  controls?: string[];
};

export type YMapEvent = {
  get: (name: string) => unknown;
};

export type YMapEventsCollection = {
  add: (eventName: string, handler: (event: YMapEvent) => void) => void;
  remove: (eventName: string, handler: (event: YMapEvent) => void) => void;
};

export type YPlacemarkInstance = {
  events: YMapEventsCollection;
};

export type YMapInstance = {
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

export type YMapsNamespace = {
  ready: (callback: () => void) => void;
  Map: new (container: HTMLElement, state: YMapState, options?: Record<string, unknown>) => YMapInstance;
  Placemark: new (
    coordinates: Coordinates,
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YPlacemarkInstance;
};

declare global {
  interface Window {
    ymaps?: YMapsNamespace;
  }
}
