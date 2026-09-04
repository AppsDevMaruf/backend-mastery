import { UserRole } from '../../user/user.entity';

export interface JwtPayload {
  sub: number;
  name: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
