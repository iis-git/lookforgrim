import type { Coordinates } from '../model/types';

export const formatCoordinates = (coordinates: Coordinates): string => `${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`;

export const formatUpdatedAt = (value: string): string => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString('ru-RU');
};
