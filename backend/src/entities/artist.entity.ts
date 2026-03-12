import { Point } from 'geojson';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ArtistAvailabilityEntity } from './artist-availability.entity';
import { ArtistCategory } from '../shared/enums/artist-category.enum';
import { ArtistServiceKind } from '../shared/enums/artist-service-kind.enum';
import { VisibilityScope } from '../shared/enums/visibility-scope.enum';

@Entity({ name: 'artists' })
export class ArtistEntity extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ name: 'phone_personal', type: 'varchar', length: 32 })
  phonePersonal!: string;

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

  @Column({ name: 'work_radius_km', type: 'integer', default: 20 })
  workRadiusKm!: number;

  @Column({ name: 'has_car', type: 'boolean', default: false })
  hasCar!: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: ArtistCategory,
    default: ArtistCategory.MASTER,
  })
  category!: ArtistCategory;

  @Column({
    type: 'enum',
    enum: ArtistServiceKind,
    array: true,
    default: () => "'{}'",
  })
  services!: ArtistServiceKind[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  languages!: string[];

  @Column({
    type: 'enum',
    enum: VisibilityScope,
    default: VisibilityScope.TEAM,
  })
  visibility!: VisibilityScope;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(
    () => ArtistAvailabilityEntity,
    (availability) => availability.artist,
    {
      cascade: true,
      eager: true,
    },
  )
  availabilitySlots!: ArtistAvailabilityEntity[];
}
