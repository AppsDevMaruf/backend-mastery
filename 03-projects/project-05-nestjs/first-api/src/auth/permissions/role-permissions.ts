import { UserRole } from '../../user/user.entity';
import { Permission } from './permission.enum';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_DELETE,

    Permission.INCOME_READ_OWN,
    Permission.INCOME_CREATE_OWN,
    Permission.INCOME_DELETE_OWN,
  ],

  [UserRole.USER]: [
    Permission.INCOME_READ_OWN,
    Permission.INCOME_CREATE_OWN,
    Permission.INCOME_DELETE_OWN,
  ],
};
