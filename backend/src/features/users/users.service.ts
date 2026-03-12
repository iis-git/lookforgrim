import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { UserRole } from '../../shared/enums/user-role.enum';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async getUsers(query: GetUsersQueryDto): Promise<PublicUser[]> {
    const where = query.role ? { role: query.role } : {};

    const users = await this.usersRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async updateUserRole(userId: string, role: UserRole): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;

    const savedUser = await this.usersRepository.save(user);
    return this.toPublicUser(savedUser);
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: {
        email: email.toLowerCase().trim(),
      },
    });
  }

  async getByIdOrThrow(userId: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<UserEntity> {
    const existingUser = await this.getByEmail(params.email);

    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const entity = this.usersRepository.create({
      email: params.email.toLowerCase().trim(),
      passwordHash: params.passwordHash,
      role: params.role,
      isActive: true,
    });

    return this.usersRepository.save(entity);
  }

  async countPrivilegedUsers(): Promise<number> {
    return this.usersRepository.count({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.OPERATOR }],
    });
  }

  toPublicUser(user: UserEntity): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
