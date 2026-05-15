// ==========================================
// GRAPHQL OBJECT TYPES
// Maps our internal types to GraphQL schema
// ==========================================

import { ObjectType, Field, ID, Int, Float, InputType, registerEnumType } from '@nestjs/graphql';

// Gender enum for GraphQL
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNKNOWN = 'unknown',
}

registerEnumType(Gender, { name: 'Gender' });

// Person GraphQL Object Type
@ObjectType()
export class PersonGQL {
  @Field(() => ID)
  id!: string;

  @Field()
  firstName!: string;

  @Field({ nullable: true })
  middleName?: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  maidenName?: string;

  @Field(() => Gender)
  gender!: Gender;

  @Field({ nullable: true })
  birthDate?: string;

  @Field({ nullable: true })
  deathDate?: string;

  @Field({ nullable: true })
  birthPlace?: string;

  @Field({ nullable: true })
  deathPlace?: string;

  @Field({ nullable: true })
  photo?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Int)
  generation!: number;

  @Field({ nullable: true })
  positionX?: number;

  @Field({ nullable: true })
  positionY?: number;

  @Field({ nullable: true })
  positionZ?: number;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}

// Tree Stats GraphQL Object Type
@ObjectType()
export class TreeStatsGQL {
  @Field(() => Int)
  totalPeople!: number;

  @Field(() => Int)
  totalGenerations!: number;

  @Field(() => Int)
  maxDepth!: number;

  @Field(() => PersonGQL, { nullable: true })
  rootPerson?: PersonGQL;
}

// Person Summary for list views
@ObjectType()
export class PersonSummaryGQL {
  @Field(() => ID)
  id!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field(() => Gender)
  gender!: Gender;

  @Field({ nullable: true })
  birthDate?: string;

  @Field({ nullable: true })
  photo?: string;
}

// Parent-Child relationship for tree visualization
@ObjectType()
export class ParentChildRelation {
  @Field(() => ID)
  parentId!: string;

  @Field(() => ID)
  childId!: string;
}

// Spouse relationship for tree visualization
@ObjectType()
export class SpouseRelation {
  @Field(() => ID)
  personId!: string;

  @Field(() => ID)
  spouseId!: string;
}

// Create Person Input
@InputType()
export class CreatePersonInputGQL {
  @Field()
  firstName!: string;

  @Field({ nullable: true })
  middleName?: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  maidenName?: string;

  @Field(() => Gender)
  gender!: Gender;

  @Field({ nullable: true })
  birthDate?: string;

  @Field({ nullable: true })
  deathDate?: string;

  @Field({ nullable: true })
  birthPlace?: string;

  @Field({ nullable: true })
  deathPlace?: string;

  @Field({ nullable: true })
  photo?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => Float, { nullable: true })
  generation?: number;

  @Field(() => Float, { nullable: true })
  positionX?: number;

  @Field(() => Float, { nullable: true })
  positionY?: number;

  @Field(() => Float, { nullable: true })
  positionZ?: number;
}

// Update Person Input
@InputType()
export class UpdatePersonInputGQL {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  middleName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  maidenName?: string;

  @Field(() => Gender, { nullable: true })
  gender?: Gender;

  @Field({ nullable: true })
  birthDate?: string;

  @Field({ nullable: true })
  deathDate?: string;

  @Field({ nullable: true })
  birthPlace?: string;

  @Field({ nullable: true })
  deathPlace?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  photo?: string;
}

// Update Person Position Input
@InputType()
export class UpdatePersonPositionInputGQL {
  @Field(() => Float)
  positionX!: number;

  @Field(() => Float)
  positionY!: number;

  @Field(() => Float)
  positionZ!: number;
}