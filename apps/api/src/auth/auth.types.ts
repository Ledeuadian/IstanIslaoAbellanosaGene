// ===========================================
// AUTH GRAPHQL TYPES
// ===========================================

import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role for access control',
});

@ObjectType()
export class UserGQL {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class AuthPayload {
  @Field()
  token!: string;

  @Field(() => UserGQL)
  user!: UserGQL;
}

@ObjectType()
export class LoginInput {
  @Field()
  username!: string;

  @Field()
  password!: string;
}

@ObjectType()
export class RegisterInput {
  @Field()
  username!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  email?: string;
}