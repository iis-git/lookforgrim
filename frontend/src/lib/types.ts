export type UserRole =
  | 'admin'
  | 'operator'
  | 'manager'
  | 'makeup_artist'
  | 'guest';

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = TokenPair & {
  user: PublicUser;
};

export type AuthSession = LoginResponse;
