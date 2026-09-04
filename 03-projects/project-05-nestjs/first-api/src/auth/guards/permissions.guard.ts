import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../types/jwt-payload.interface';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../permissions/permission.enum';
import { ROLE_PERMISSIONS } from '../permissions/role-permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User information is missing');
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] ?? [];

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permission');
    }

    return true;
  }
}
