import { UserRole } from '../../shared/enums/user-role.enum';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = TokenPair & {
  user: AuthUser;
};
