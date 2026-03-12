import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ArtistEntity } from './artist.entity';

@Entity({ name: 'artist_availability' })
export class ArtistAvailabilityEntity extends BaseEntity {
  @Column({ name: 'artist_id', type: 'uuid' })
  artistId!: string;

  @ManyToOne(() => ArtistEntity, (artist) => artist.availabilitySlots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'artist_id' })
  artist!: ArtistEntity;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek!: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable!: boolean;
}
