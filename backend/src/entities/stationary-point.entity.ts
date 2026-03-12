import { Point } from 'geojson';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PointType } from '../shared/enums/point-type.enum';
import { VisibilityScope } from '../shared/enums/visibility-scope.enum';

@Entity({ name: 'stationary_points' })
export class StationaryPointEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: PointType,
  })
  type!: PointType;

  @Column({ type: 'varchar', length: 500 })
  address!: string;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Index()
  @Column({ type: 'varchar', length: 120, nullable: true })
  district!: string | null;

  @Index()
  @Column({
    name: 'metro_station',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  metroStation!: string | null;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location!: Point | null;

  @Column({ name: 'working_hours', type: 'jsonb', nullable: true })
  workingHours!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: VisibilityScope,
    default: VisibilityScope.TEAM,
  })
  visibility!: VisibilityScope;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
