import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../shared/enums/user-role.enum';

export class GetUsersQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
