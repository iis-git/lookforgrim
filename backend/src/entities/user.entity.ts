import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from '../shared/enums/user-role.enum';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MANAGER,
  })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
