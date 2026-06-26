// src/auth/guards/roles.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEYS } from '../decorators/role.decorator';
import { Role } from '../enums/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE_KEYS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('Access denied: Insufficient permissions');
    }

    const userRole =
      typeof user.role === 'string'
        ? user.role.trim()
        : user.role != null
          ? String(user.role)
          : '';

    const ok = requiredRoles.some((role) => userRole === role);
    if (!ok) {
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }

    return true;
  }
}
