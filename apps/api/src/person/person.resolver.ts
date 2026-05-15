import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonGQL, CreatePersonInputGQL, UpdatePersonInputGQL, UpdatePersonPositionInputGQL } from '../graphql/graphql.types';
import { Gender } from '../graphql/graphql.types';
import { AdminGuard } from '../auth/auth.guard';

@Resolver(() => PersonGQL)
export class PersonResolver {
  constructor(private readonly personService: PersonService) {}

  // === PUBLIC QUERIES (no auth required) ===

  @Query(() => [PersonGQL])
  async persons(): Promise<PersonGQL[]> {
    const persons = await this.personService.findAll();
    return persons.map(this.toGQL);
  }

  @Query(() => PersonGQL, { nullable: true })
  async person(@Args('id', { type: () => String }) id: string): Promise<PersonGQL | null> {
    const person = await this.personService.findOne(id);
    return person ? this.toGQL(person) : null;
  }

  @Query(() => [PersonGQL])
  async children(
    @Args('parentId', { type: () => String }) parentId: string
  ): Promise<PersonGQL[]> {
    const persons = await this.personService.findChildren(parentId);
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async parents(
    @Args('childId', { type: () => String }) childId: string
  ): Promise<PersonGQL[]> {
    const persons = await this.personService.findParents(childId);
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async spouses(
    @Args('personId', { type: () => String }) personId: string
  ): Promise<PersonGQL[]> {
    const persons = await this.personService.findSpouses(personId);
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async siblings(
    @Args('personId', { type: () => String }) personId: string
  ): Promise<PersonGQL[]> {
    const persons = await this.personService.findSiblings(personId);
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async descendants(
    @Args('rootId', { type: () => String }) rootId: string,
    @Args('maxDepth', { type: () => Number, defaultValue: 10 }) maxDepth: number
  ): Promise<PersonGQL[]> {
    const persons = await this.personService.getAllDescendants(rootId, maxDepth);
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async searchPersons(
    @Args('query', { type: () => String }) query: string
  ): Promise<PersonGQL[]> {
    const persons = await this.personService.search(query);
    return persons.map(this.toGQL);
  }

  // === PROTECTED MUTATIONS (admin only) ===

  @Mutation(() => PersonGQL)
  @UseGuards(AdminGuard)
  async createPerson(
    @Args('input', { type: () => CreatePersonInputGQL }) input: CreatePersonInputGQL,
    @Args('parentId', { nullable: true, type: () => String }) parentId?: string
  ): Promise<PersonGQL> {
    console.log('[PersonResolver] createPerson called');
    console.log('[PersonResolver] input:', JSON.stringify(input, null, 2));
    console.log('[PersonResolver] parentId:', parentId);
    
    const person = await this.personService.create({
      ...input,
      gender: input.gender.toLowerCase() as any,
      positionX: input.positionX,
      positionY: input.positionY,
      positionZ: input.positionZ,
    });

    // If parentId is provided, create the PARENT_OF relationship
    if (parentId) {
      await this.personService.addParent(parentId, person.id);
    }

    return this.toGQL(person);
  }

  @Mutation(() => PersonGQL, { nullable: true })
  @UseGuards(AdminGuard)
  async updatePerson(
    @Args('id', { type: () => String }) id: string,
    @Args('input', { type: () => UpdatePersonInputGQL }) input: UpdatePersonInputGQL
  ): Promise<PersonGQL | null> {
    const person = await this.personService.update(id, {
      ...input,
      gender: input.gender?.toLowerCase() as any,
    });
    return person ? this.toGQL(person) : null;
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  async deletePerson(@Args('id') id: string): Promise<boolean> {
    return this.personService.delete(id);
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  async addParent(
    @Args('parentId') parentId: string,
    @Args('childId') childId: string,
    @Args('type', { nullable: true, defaultValue: 'biological' }) type: string
  ): Promise<boolean> {
    return this.personService.addParent(parentId, childId, type);
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  async addSpouse(
    @Args('personId') personId: string,
    @Args('spouseId') spouseId: string,
    @Args('type', { nullable: true, defaultValue: 'married' }) type: string
  ): Promise<boolean> {
    return this.personService.addSpouse(personId, spouseId, type);
  }

  @Mutation(() => PersonGQL, { nullable: true })
  @UseGuards(AdminGuard)
  async updatePersonPosition(
    @Args('id', { type: () => String }) id: string,
    @Args('input', { type: () => UpdatePersonPositionInputGQL }) input: UpdatePersonPositionInputGQL
  ): Promise<PersonGQL | null> {
    const person = await this.personService.update(id, {
      positionX: input.positionX,
      positionY: input.positionY,
      positionZ: input.positionZ,
    });
    return person ? this.toGQL(person) : null;
  }

  private toGQL(person: any): PersonGQL {
    return {
      id: person.id,
      firstName: person.firstName,
      middleName: person.middleName,
      lastName: person.lastName,
      maidenName: person.maidenName,
      gender: person.gender === 'male' ? Gender.MALE : person.gender === 'female' ? Gender.FEMALE : Gender.OTHER,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      birthPlace: person.birthPlace,
      deathPlace: person.deathPlace,
      photo: person.photo,
      bio: person.bio,
      notes: person.notes,
      generation: person.generation,
      positionX: person.positionX,
      positionY: person.positionY,
      positionZ: person.positionZ,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    };
  }
}
