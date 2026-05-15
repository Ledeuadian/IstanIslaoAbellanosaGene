import { Resolver, Query, Mutation, Args, ID, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FamilyService } from './family.service';
import { AdminGuard } from '../auth/auth.guard';

@ObjectType()
export class FamilyGQL {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  createdAt!: string;
}

@Resolver(() => FamilyGQL)
export class FamilyResolver {
  constructor(private readonly familyService: FamilyService) {}

  @Query(() => [FamilyGQL])
  async families(): Promise<FamilyGQL[]> {
    return this.familyService.findAll();
  }

  @Query(() => FamilyGQL, { nullable: true })
  async family(@Args('id', { type: () => String }) id: string): Promise<FamilyGQL | null> {
    return this.familyService.findOne(id);
  }

  @Query(() => [FamilyGQL])
  async familiesForPerson(
    @Args('personId', { type: () => String }) personId: string
  ): Promise<FamilyGQL[]> {
    return this.familyService.findFamiliesForPerson(personId);
  }

  @Mutation(() => FamilyGQL)
  @UseGuards(AdminGuard)
  async createFamily(
    @Args('name', { type: () => String, nullable: true }) name?: string
  ): Promise<FamilyGQL> {
    return this.familyService.create({ name });
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  async deleteFamily(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    return this.familyService.delete(id);
  }
}
