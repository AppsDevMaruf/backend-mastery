import { UserRole } from '../../user/user.entity';

export interface JwtPayload {
  sub: number;
  name: string;
  email: string;
  role: UserRole;
  jti?: string;
  iat?: number;
  exp?: number;
}
