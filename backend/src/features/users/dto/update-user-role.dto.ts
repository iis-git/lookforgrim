import { IsEnum } from 'class-validator';
import { UserRole } from '../../../shared/enums/user-role.enum';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
