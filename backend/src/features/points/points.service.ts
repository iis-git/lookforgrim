import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from 'geojson';
import { Repository } from 'typeorm';
import { StationaryPointEntity } from '../../entities/stationary-point.entity';
import { UploadedImageInput } from '../../shared/http/uploaded-image.util';
import { MediaService } from '../media/media.service';
import { CreatePointDto } from './dto/create-point.dto';
import { QueryPointsDto } from './dto/query-points.dto';
import { UpdatePointLocationDto } from './dto/update-point-location.dto';
import { UpdatePointDto } from './dto/update-point.dto';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(StationaryPointEntity)
    private readonly pointsRepository: Repository<StationaryPointEntity>,
    private readonly mediaService: MediaService,
  ) {}

  async create(dto: CreatePointDto): Promise<StationaryPointEntity> {
    const entity = this.pointsRepository.create({
      name: dto.name,
      type: dto.type,
      address: dto.address,
      city: dto.city,
      district: dto.district ?? null,
      metroStation: dto.metroStation ?? null,
      location: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      },
      workingHours: dto.workingHours ?? null,
      phone: dto.phone ?? null,
      description: dto.description ?? null,
      visibility: dto.visibility,
      isActive: true,
    });

    const saved = await this.pointsRepository.save(entity);
    return this.findByIdOrThrow(saved.id);
  }

  async findAll(query: QueryPointsDto): Promise<StationaryPointEntity[]> {
    const qb = this.pointsRepository
      .createQueryBuilder('point')
      .orderBy('point.createdAt', 'DESC');

    if (query.q) {
      qb.andWhere('(point.name ILIKE :q OR point.address ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    if (query.city) {
      qb.andWhere('point.city = :city', { city: query.city });
    }

    if (query.district) {
      qb.andWhere('point.district = :district', { district: query.district });
    }

    if (query.metroStation) {
      qb.andWhere('point.metroStation = :metroStation', {
        metroStation: query.metroStation,
      });
    }

    if (query.types && query.types.length > 0) {
      qb.andWhere('point.type IN (:...types)', { types: query.types });
    }

    return qb.getMany();
  }

  async findByIdOrThrow(id: string): Promise<StationaryPointEntity> {
    const point = await this.pointsRepository.findOne({ where: { id } });

    if (!point) {
      throw new NotFoundException('Point not found');
    }

    return point;
  }

  async update(
    id: string,
    dto: UpdatePointDto,
  ): Promise<StationaryPointEntity> {
    const point = await this.findByIdOrThrow(id);

    if (dto.name !== undefined) {
      point.name = dto.name;
    }

    if (dto.type !== undefined) {
      point.type = dto.type;
    }

    if (dto.address !== undefined) {
      point.address = dto.address;
    }

    if (dto.city !== undefined) {
      point.city = dto.city;
    }

    if (dto.district !== undefined) {
      point.district = dto.district;
    }

    if (dto.metroStation !== undefined) {
      point.metroStation = dto.metroStation;
    }

    if (dto.phone !== undefined) {
      point.phone = dto.phone;
    }

    if (dto.description !== undefined) {
      point.description = dto.description;
    }

    if (dto.workingHours !== undefined) {
      point.workingHours = dto.workingHours;
    }

    if (dto.visibility !== undefined) {
      point.visibility = dto.visibility;
    }

    await this.pointsRepository.save(point);
    return this.findByIdOrThrow(id);
  }

  async updateLocation(
    id: string,
    dto: UpdatePointLocationDto,
  ): Promise<StationaryPointEntity> {
    const point = await this.findByIdOrThrow(id);

    point.location = this.toPoint(dto.latitude, dto.longitude);

    await this.pointsRepository.save(point);
    return this.findByIdOrThrow(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const result = await this.pointsRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('Point not found');
    }

    return { success: true };
  }

  async uploadPhoto(id: string, image: UploadedImageInput) {
    await this.findByIdOrThrow(id);
    return this.mediaService.uploadForPoint(id, image);
  }

  async listPhotos(id: string) {
    await this.findByIdOrThrow(id);
    return this.mediaService.listForPoint(id);
  }

  async deletePhoto(id: string, mediaId: string): Promise<{ success: true }> {
    await this.findByIdOrThrow(id);
    return this.mediaService.removeForPoint(id, mediaId);
  }

  private toPoint(latitude: number, longitude: number): Point {
    return {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }
}
