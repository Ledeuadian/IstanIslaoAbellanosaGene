// ===========================================
// AUTH RESOLVER
// ===========================================

import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload, UserGQL, UserRole } from './auth.types';

@Resolver(() => UserGQL)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(
    @Args('username') username: string,
    @Args('password') password: string,
    @Args('email', { nullable: true }) email?: string,
  ): Promise<AuthPayload> {
    return this.authService.register(username, password, email);
  }

  @Mutation(() => AuthPayload)
  async login(
    @Args('username') username: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.login(username, password);
  }

  @Query(() => UserGQL, { nullable: true })
  async me(@Context() context: any): Promise<UserGQL | null> {
    const authHeader = context.req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = await this.authService.decodeToken(token);
    if (!decoded) {
      return null;
    }

    return this.authService.validateUser(decoded.sub);
  }

  @Mutation(() => Boolean)
  async changePassword(
    @Context() context: any,
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    const authHeader = context.req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.substring(7);
    const decoded = await this.authService.decodeToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    return this.authService.changePassword(decoded.sub, oldPassword, newPassword);
  }
}