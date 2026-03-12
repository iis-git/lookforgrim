import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from 'geojson';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ArtistEntity } from '../../entities/artist.entity';
import { StationaryPointEntity } from '../../entities/stationary-point.entity';
import { ArtistCategory } from '../../shared/enums/artist-category.enum';
import { ArtistServiceKind } from '../../shared/enums/artist-service-kind.enum';
import { MapMarkersQueryDto } from './dto/map-markers-query.dto';
import { NearestArtistsDto } from './dto/nearest-artists.dto';

type ArtistMarker = {
  id: string;
  fullName: string;
  city: string;
  district: string | null;
  metroStation: string | null;
  category: string;
  services: string[];
  hasCar: boolean;
  coordinates: { lat: number; lng: number };
};

const CATEGORY_WEIGHTS: Record<ArtistCategory, number> = {
  [ArtistCategory.PREMIUM]: 4,
  [ArtistCategory.TOP]: 3,
  [ArtistCategory.MASTER]: 2,
  [ArtistCategory.NEW]: 1,
};

type PointMarker = {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  metroStation: string | null;
  coordinates: { lat: number; lng: number };
};

type NearestArtistResult = {
  id: string;
  fullName: string;
  city: string;
  district: string | null;
  metroStation: string | null;
  category: string;
  services: string[];
  hasCar: boolean;
  workRadiusKm: number;
  distanceKm: number;
  coordinates: { lat: number; lng: number };
};

@Injectable()
export class MapSearchService {
  constructor(
    @InjectRepository(ArtistEntity)
    private readonly artistsRepository: Repository<ArtistEntity>,
    @InjectRepository(StationaryPointEntity)
    private readonly pointsRepository: Repository<StationaryPointEntity>,
  ) {}

  async getMarkers(query: MapMarkersQueryDto): Promise<{
    artists: ArtistMarker[];
    points: PointMarker[];
  }> {
    this.validateBoundingBox(query);

    const includeArtists = query.includeArtists ?? true;
    const includePoints = query.includePoints ?? true;
    const limit = query.limit ?? 1000;

    const [artists, points] = await Promise.all([
      includeArtists
        ? this.getArtistMarkers(query, limit)
        : Promise.resolve([]),
      includePoints ? this.getPointMarkers(query, limit) : Promise.resolve([]),
    ]);

    return {
      artists,
      points,
    };
  }

  async getNearestArtists(dto: NearestArtistsDto): Promise<{
    target: { lat: number; lng: number };
    artists: NearestArtistResult[];
  }> {
    const target = await this.resolveTargetPoint(dto);
    const limit = dto.limit ?? 20;

    const qb = this.artistsRepository
      .createQueryBuilder('artist')
      .leftJoinAndSelect('artist.availabilitySlots', 'availability')
      .where('artist.is_active = true')
      .andWhere('artist.location IS NOT NULL')
      .addSelect(
        'ST_DistanceSphere(artist.location::geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'distance_meters',
      )
      .setParameters({
        lng: target.lng,
        lat: target.lat,
      })
      .orderBy('distance_meters', 'ASC')
      .limit(limit * 3);

    if (dto.q) {
      qb.andWhere('artist.full_name ILIKE :q', {
        q: `%${dto.q}%`,
      });
    }

    if (dto.city) {
      qb.andWhere('artist.city = :city', { city: dto.city });
    }

    if (dto.district) {
      qb.andWhere('artist.district = :district', { district: dto.district });
    }

    if (dto.metroStation) {
      qb.andWhere('artist.metro_station = :metroStation', {
        metroStation: dto.metroStation,
      });
    }

    if (dto.hasCar !== undefined) {
      qb.andWhere('artist.has_car = :hasCar', { hasCar: dto.hasCar });
    }

    if (dto.category && dto.category.length > 0) {
      qb.andWhere('artist.category IN (:...categories)', {
        categories: dto.category,
      });
    }

    const { entities, raw } = await qb.getRawAndEntities<{
      distance_meters: string | number | null;
    }>();
    const availability = resolveAvailabilityContext(dto);

    const withDistance = entities
      .map((artist, index) => ({
        artist,
        distanceMeters: Number(
          raw[index]?.distance_meters ?? Number.MAX_SAFE_INTEGER,
        ),
      }))
      .filter(({ artist, distanceMeters }) => {
        const distanceKm = metersToKilometers(distanceMeters);
        const isWithinRadius = distanceKm <= artist.workRadiusKm;

        if (!isWithinRadius) {
          return false;
        }

        if (
          dto.services &&
          dto.services.length > 0 &&
          !hasAnyService(artist.services, dto.services)
        ) {
          return false;
        }

        if (
          dto.languages &&
          dto.languages.length > 0 &&
          !hasAnyString(artist.languages, dto.languages)
        ) {
          return false;
        }

        if (!availability) {
          return true;
        }

        return artist.availabilitySlots.some(
          (slot) =>
            slot.dayOfWeek === availability.dayOfWeek &&
            slot.isAvailable &&
            slot.startTime <= availability.time &&
            slot.endTime >= availability.time,
        );
      })
      .sort((a, b) => {
        if (a.distanceMeters !== b.distanceMeters) {
          return a.distanceMeters - b.distanceMeters;
        }

        return (
          categoryWeight(b.artist.category) - categoryWeight(a.artist.category)
        );
      })
      .slice(0, limit)
      .map(({ artist, distanceMeters }) => ({
        id: artist.id,
        fullName: artist.fullName,
        city: artist.city,
        district: artist.district,
        metroStation: artist.metroStation,
        category: artist.category,
        services: artist.services,
        hasCar: artist.hasCar,
        workRadiusKm: artist.workRadiusKm,
        distanceKm: metersToKilometers(distanceMeters),
        coordinates: pointToCoordinates(artist.location),
      }));

    return {
      target,
      artists: withDistance,
    };
  }

  private async getArtistMarkers(
    query: MapMarkersQueryDto,
    limit: number,
  ): Promise<ArtistMarker[]> {
    const needsPostFilter =
      Boolean(query.services && query.services.length > 0) ||
      Boolean(query.languages && query.languages.length > 0);
    const fetchLimit = needsPostFilter ? Math.max(limit * 3, limit) : limit;

    const qb = this.artistsRepository
      .createQueryBuilder('artist')
      .where('artist.is_active = true')
      .andWhere('artist.location IS NOT NULL')
      .orderBy('artist.created_at', 'DESC')
      .limit(fetchLimit);

    this.applyCommonLocationFilters(qb, query, 'artist');

    if (query.q) {
      qb.andWhere('artist.full_name ILIKE :q', { q: `%${query.q}%` });
    }

    if (query.hasCar !== undefined) {
      qb.andWhere('artist.has_car = :hasCar', { hasCar: query.hasCar });
    }

    if (query.category && query.category.length > 0) {
      qb.andWhere('artist.category IN (:...categories)', {
        categories: query.category,
      });
    }

    const artists = await qb.getMany();

    const filteredArtists = artists
      .filter((artist) => {
        if (
          query.services &&
          query.services.length > 0 &&
          !hasAnyService(artist.services, query.services)
        ) {
          return false;
        }

        if (
          query.languages &&
          query.languages.length > 0 &&
          !hasAnyString(artist.languages, query.languages)
        ) {
          return false;
        }

        return true;
      })
      .slice(0, limit);

    return filteredArtists.map((artist) => ({
      id: artist.id,
      fullName: artist.fullName,
      city: artist.city,
      district: artist.district,
      metroStation: artist.metroStation,
      category: artist.category,
      services: artist.services,
      hasCar: artist.hasCar,
      coordinates: pointToCoordinates(artist.location),
    }));
  }

  private async getPointMarkers(
    query: MapMarkersQueryDto,
    limit: number,
  ): Promise<PointMarker[]> {
    const qb = this.pointsRepository
      .createQueryBuilder('point')
      .where('point.is_active = true')
      .andWhere('point.location IS NOT NULL')
      .orderBy('point.created_at', 'DESC')
      .limit(limit);

    this.applyCommonLocationFilters(qb, query, 'point');

    if (query.q) {
      qb.andWhere('(point.name ILIKE :q OR point.address ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    const points = await qb.getMany();

    return points.map((point) => ({
      id: point.id,
      name: point.name,
      type: point.type,
      city: point.city,
      district: point.district,
      metroStation: point.metroStation,
      coordinates: pointToCoordinates(point.location),
    }));
  }

  private applyCommonLocationFilters(
    qb: SelectQueryBuilder<object>,
    query: MapMarkersQueryDto,
    alias: 'artist' | 'point',
  ): void {
    if (query.city) {
      qb.andWhere(`${alias}.city = :city`, { city: query.city });
    }

    if (query.district) {
      qb.andWhere(`${alias}.district = :district`, {
        district: query.district,
      });
    }

    if (query.metroStation) {
      qb.andWhere(`${alias}.metro_station = :metroStation`, {
        metroStation: query.metroStation,
      });
    }

    if (
      query.minLat !== undefined &&
      query.minLng !== undefined &&
      query.maxLat !== undefined &&
      query.maxLng !== undefined
    ) {
      qb.andWhere(
        `ST_Within(${alias}.location::geometry, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))`,
        {
          minLat: query.minLat,
          minLng: query.minLng,
          maxLat: query.maxLat,
          maxLng: query.maxLng,
        },
      );
    }
  }

  private async resolveTargetPoint(
    dto: NearestArtistsDto,
  ): Promise<{ lat: number; lng: number }> {
    const hasPointId = Boolean(dto.pointId);
    const hasCoordinates =
      dto.latitude !== undefined && dto.longitude !== undefined;

    if (!hasPointId && !hasCoordinates) {
      throw new BadRequestException(
        'Either pointId or both latitude and longitude must be provided',
      );
    }

    if (hasPointId && hasCoordinates) {
      throw new BadRequestException(
        'Provide either pointId or coordinates, not both',
      );
    }

    if (dto.pointId) {
      const point = await this.pointsRepository.findOne({
        where: { id: dto.pointId },
      });

      if (!point || !point.location) {
        throw new BadRequestException('Point not found or has no location');
      }

      return pointToCoordinates(point.location);
    }

    if (dto.latitude === undefined || dto.longitude === undefined) {
      throw new BadRequestException('Coordinates are required');
    }

    return {
      lat: dto.latitude,
      lng: dto.longitude,
    };
  }

  private validateBoundingBox(query: MapMarkersQueryDto): void {
    const values = [query.minLat, query.minLng, query.maxLat, query.maxLng];
    const filledCount = values.filter((value) => value !== undefined).length;

    if (filledCount > 0 && filledCount < 4) {
      throw new BadRequestException(
        'Bounding box requires all minLat, minLng, maxLat, maxLng values',
      );
    }

    if (
      filledCount === 4 &&
      query.minLat !== undefined &&
      query.maxLat !== undefined &&
      query.minLng !== undefined &&
      query.maxLng !== undefined
    ) {
      if (query.minLat >= query.maxLat || query.minLng >= query.maxLng) {
        throw new BadRequestException('Invalid bounding box coordinates');
      }
    }
  }
}

function pointToCoordinates(point: Point | null): { lat: number; lng: number } {
  if (!point) {
    return {
      lat: 0,
      lng: 0,
    };
  }

  const [lng, lat] = point.coordinates;

  return {
    lat,
    lng,
  };
}

function metersToKilometers(value: number): number {
  const km = value / 1000;
  return Number(km.toFixed(2));
}

function resolveAvailabilityContext(dto: NearestArtistsDto) {
  if (dto.dayOfWeek !== undefined && dto.time) {
    return {
      dayOfWeek: dto.dayOfWeek,
      time: dto.time,
    };
  }

  if (dto.orderDateTime) {
    const date = new Date(dto.orderDateTime);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    const dayOfWeek = date.getDay();
    const time = date.toISOString().slice(11, 16);

    return {
      dayOfWeek,
      time,
    };
  }

  return undefined;
}

function categoryWeight(category: ArtistCategory): number {
  return CATEGORY_WEIGHTS[category] ?? 0;
}

function hasAnyService(
  artistServices: ArtistServiceKind[],
  selectedServices: ArtistServiceKind[],
): boolean {
  if (selectedServices.length === 0) {
    return true;
  }

  const servicesSet = new Set(artistServices);
  return selectedServices.some((service) => servicesSet.has(service));
}

function hasAnyString(values: string[], selectedValues: string[]): boolean {
  if (selectedValues.length === 0) {
    return true;
  }

  const lowerValuesSet = new Set(values.map((value) => value.toLowerCase()));

  return selectedValues.some((value) =>
    lowerValuesSet.has(value.trim().toLowerCase()),
  );
}
