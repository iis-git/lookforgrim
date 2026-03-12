import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from 'geojson';
import { Repository } from 'typeorm';
import { ArtistAvailabilityEntity } from '../../entities/artist-availability.entity';
import { ArtistEntity } from '../../entities/artist.entity';
import { ArtistServiceKind } from '../../shared/enums/artist-service-kind.enum';
import { UploadedImageInput } from '../../shared/http/uploaded-image.util';
import { MediaService } from '../media/media.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { QueryArtistsDto } from './dto/query-artists.dto';
import { UpdateArtistLocationDto } from './dto/update-artist-location.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { UpsertArtistAvailabilityDto } from './dto/upsert-artist-availability.dto';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(ArtistEntity)
    private readonly artistsRepository: Repository<ArtistEntity>,
    @InjectRepository(ArtistAvailabilityEntity)
    private readonly availabilityRepository: Repository<ArtistAvailabilityEntity>,
    private readonly mediaService: MediaService,
  ) {}

  async create(dto: CreateArtistDto): Promise<ArtistEntity> {
    const location = this.resolveLocation(dto.latitude, dto.longitude);

    const entity = this.artistsRepository.create({
      fullName: dto.fullName,
      phonePersonal: dto.phonePersonal,
      city: dto.city,
      district: dto.district ?? null,
      metroStation: dto.metroStation ?? null,
      location,
      workRadiusKm: dto.workRadiusKm ?? 20,
      hasCar: dto.hasCar ?? false,
      category: dto.category,
      services: dto.services ?? [],
      languages: dto.languages ?? [],
      visibility: dto.visibility,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
      availabilitySlots:
        dto.availabilitySlots?.map((slot) =>
          this.availabilityRepository.create({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: slot.isAvailable ?? true,
          }),
        ) ?? [],
    });

    const saved = await this.artistsRepository.save(entity);
    return this.findByIdOrThrow(saved.id);
  }

  async findAll(query: QueryArtistsDto): Promise<ArtistEntity[]> {
    const qb = this.artistsRepository
      .createQueryBuilder('artist')
      .leftJoinAndSelect('artist.availabilitySlots', 'availability')
      .orderBy('artist.createdAt', 'DESC');

    if (query.q) {
      qb.andWhere('artist.fullName ILIKE :q', { q: `%${query.q}%` });
    }

    if (query.city) {
      qb.andWhere('artist.city = :city', { city: query.city });
    }

    if (query.district) {
      qb.andWhere('artist.district = :district', { district: query.district });
    }

    if (query.metroStation) {
      qb.andWhere('artist.metroStation = :metroStation', {
        metroStation: query.metroStation,
      });
    }

    if (query.hasCar !== undefined) {
      qb.andWhere('artist.hasCar = :hasCar', { hasCar: query.hasCar });
    }

    if (query.category && query.category.length > 0) {
      qb.andWhere('artist.category IN (:...categories)', {
        categories: query.category,
      });
    }

    const artists = await qb.getMany();

    return artists.filter((artist) => {
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
    });
  }

  async findByIdOrThrow(id: string): Promise<ArtistEntity> {
    const artist = await this.artistsRepository.findOne({
      where: { id },
      relations: {
        availabilitySlots: true,
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    return artist;
  }

  async update(id: string, dto: UpdateArtistDto): Promise<ArtistEntity> {
    const artist = await this.findByIdOrThrow(id);

    if (dto.fullName !== undefined) {
      artist.fullName = dto.fullName;
    }

    if (dto.phonePersonal !== undefined) {
      artist.phonePersonal = dto.phonePersonal;
    }

    if (dto.city !== undefined) {
      artist.city = dto.city;
    }

    if (dto.district !== undefined) {
      artist.district = dto.district;
    }

    if (dto.metroStation !== undefined) {
      artist.metroStation = dto.metroStation;
    }

    if (dto.workRadiusKm !== undefined) {
      artist.workRadiusKm = dto.workRadiusKm;
    }

    if (dto.hasCar !== undefined) {
      artist.hasCar = dto.hasCar;
    }

    if (dto.category !== undefined) {
      artist.category = dto.category;
    }

    if (dto.services !== undefined) {
      artist.services = dto.services;
    }

    if (dto.languages !== undefined) {
      artist.languages = dto.languages;
    }

    if (dto.visibility !== undefined) {
      artist.visibility = dto.visibility;
    }

    if (dto.notes !== undefined) {
      artist.notes = dto.notes;
    }

    if (dto.isActive !== undefined) {
      artist.isActive = dto.isActive;
    }

    await this.artistsRepository.save(artist);
    return this.findByIdOrThrow(id);
  }

  async updateLocation(
    id: string,
    dto: UpdateArtistLocationDto,
  ): Promise<ArtistEntity> {
    const artist = await this.findByIdOrThrow(id);

    artist.location = {
      type: 'Point',
      coordinates: [dto.longitude, dto.latitude],
    };

    await this.artistsRepository.save(artist);
    return this.findByIdOrThrow(id);
  }

  async upsertAvailability(
    id: string,
    dto: UpsertArtistAvailabilityDto,
  ): Promise<ArtistEntity> {
    await this.findByIdOrThrow(id);

    await this.availabilityRepository.delete({ artistId: id });

    const entities = dto.slots.map((slot) =>
      this.availabilityRepository.create({
        artistId: id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable ?? true,
      }),
    );

    await this.availabilityRepository.save(entities);
    return this.findByIdOrThrow(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const result = await this.artistsRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('Artist not found');
    }

    return { success: true };
  }

  async uploadPhoto(id: string, image: UploadedImageInput) {
    await this.findByIdOrThrow(id);
    return this.mediaService.uploadForArtist(id, image);
  }

  async listPhotos(id: string) {
    await this.findByIdOrThrow(id);
    return this.mediaService.listForArtist(id);
  }

  async deletePhoto(id: string, mediaId: string): Promise<{ success: true }> {
    await this.findByIdOrThrow(id);
    return this.mediaService.removeForArtist(id, mediaId);
  }

  private resolveLocation(
    latitude: number | undefined,
    longitude: number | undefined,
  ): Point | null {
    if ((latitude === undefined) !== (longitude === undefined)) {
      throw new BadRequestException(
        'Both latitude and longitude are required to set location',
      );
    }

    if (latitude === undefined || longitude === undefined) {
      return null;
    }

    return {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }
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
