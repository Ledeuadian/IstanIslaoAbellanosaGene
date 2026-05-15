// ===========================================
// AUTH GUARDS & DECORATORS
// ===========================================

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

// Guard that checks if user is authenticated
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const authHeader = req?.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = await this.authService.decodeToken(token);

    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    // Attach user to request
    req.user = decoded;
    return true;
  }
}

// Guard that checks if user has admin role
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const authHeader = req?.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = await this.authService.decodeToken(token);

    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    // Case-insensitive role check (role can be 'admin' or 'ADMIN')
    if (decoded.role?.toLowerCase() !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    req.user = decoded;
    return true;
  }
}