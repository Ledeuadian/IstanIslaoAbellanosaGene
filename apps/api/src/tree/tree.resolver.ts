import { Resolver, Query, Args } from '@nestjs/graphql';
import { TreeService } from './tree.service';
import { PersonGQL, TreeStatsGQL, Gender, ParentChildRelation, SpouseRelation } from '../graphql/graphql.types';

@Resolver(() => PersonGQL)
export class TreeResolver {
  constructor(private readonly treeService: TreeService) {}

  @Query(() => [PersonGQL])
  async treeRoot(): Promise<PersonGQL[]> {
    const persons = await this.treeService.getRootNodes();
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async treeChildren(
    @Args('parentId', { type: () => String }) parentId: string
  ): Promise<PersonGQL[]> {
    const persons = await this.treeService.getChildren(parentId);
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async treeAncestors(
    @Args('personId', { type: () => String }) personId: string
  ): Promise<PersonGQL[]> {
    const persons = await this.treeService.getAncestors(personId);
    return persons.map(this.toGQL);
  }

  @Query(() => [PersonGQL])
  async treeSiblings(
    @Args('personId', { type: () => String }) personId: string
  ): Promise<PersonGQL[]> {
    const persons = await this.treeService.getSiblings(personId);
    return persons.map(this.toGQL);
  }

  @Query(() => TreeStatsGQL)
  async treeStats(): Promise<TreeStatsGQL> {
    const stats = await this.treeService.getStats();
    return {
      ...stats,
      rootPerson: stats.rootPerson ? this.toGQL(stats.rootPerson) : undefined,
    };
  }

  @Query(() => [ParentChildRelation])
  async allParentChildRelations(): Promise<ParentChildRelation[]> {
    const relations = await this.treeService.getAllParentChildRelations();
    return relations;
  }

  @Query(() => [SpouseRelation])
  async allSpouseRelations(): Promise<SpouseRelation[]> {
    const relations = await this.treeService.getAllSpouseRelations();
    return relations;
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
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    };
  }
}