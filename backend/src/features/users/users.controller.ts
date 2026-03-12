import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  getUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getUsers(query);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, dto.role);
  }
}
