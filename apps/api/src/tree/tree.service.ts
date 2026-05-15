import { Injectable, Inject } from '@nestjs/common';
import { NEO4J_DRIVER } from '../neo4j/neo4j.module';
import type { Driver, Session } from 'neo4j-driver';
import type { Person } from '@tree/types';

@Injectable()
export class TreeService {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  private getSession(): Session {
    return this.driver.session();
  }

  async getRootNodes(): Promise<Person[]> {
    const session = this.getSession();
    try {
      // Root nodes are people with generation 0 and no parents in the tree
      const result = await session.run(
        `MATCH (p:Person)
         WHERE p.generation = 0
           AND NOT exists(()-[:PARENT_OF]->(p))
         RETURN p
         ORDER BY p.lastName, p.firstName`
      );
      return result.records.map((record) => this.mapNodeToPerson(record.get('p')));
    } finally {
      await session.close();
    }
  }

  async getChildren(parentId: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (parent:Person {id: $parentId})-[:PARENT_OF]->(child:Person)
         RETURN child
         ORDER BY child.birthDate`,
        { parentId }
      );
      return result.records.map((record) => this.mapNodeToPerson(record.get('child')));
    } finally {
      await session.close();
    }
  }

  async getAncestors(personId: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $personId})-[:PARENT_OF*]->(ancestor:Person)
         RETURN DISTINCT ancestor
         ORDER BY ancestor.generation DESC`,
        { personId }
      );
      return result.records.map((record) => this.mapNodeToPerson(record.get('ancestor')));
    } finally {
      await session.close();
    }
  }

  async getSiblings(personId: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (person:Person {id: $personId})-[:PARENT_OF]->(childRel)<-[:PARENT_OF]-(sibling:Person)
         WHERE sibling.id <> $personId
         RETURN DISTINCT sibling
         ORDER BY sibling.firstName`,
        { personId }
      );
      return result.records.map((record) => this.mapNodeToPerson(record.get('sibling')));
    } finally {
      await session.close();
    }
  }

  async getStats(): Promise<{ totalPeople: number; totalGenerations: number; maxDepth: number; rootPerson?: Person }> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person)
         RETURN count(p) as totalPeople,
                max(p.generation) as maxDepth,
                collect(DISTINCT p.generation) as generations`
      );

      if (result.records.length === 0) {
        return { totalPeople: 0, totalGenerations: 0, maxDepth: 0 };
      }

      const record = result.records[0];
      const toNum = (val: any): number => {
        if (val == null) return 0;
        return typeof val.toNumber === 'function' ? val.toNumber() : Number(val);
      };
      return {
        totalPeople: toNum(record.get('totalPeople')),
        totalGenerations: record.get('generations').length,
        maxDepth: toNum(record.get('maxDepth')),
      };
    } finally {
      await session.close();
    }
  }

  async getSubtree(
    rootId: string,
    maxDepth: number = 3
  ): Promise<Map<string, { person: Person; children: string[] }>> {
    const session = this.getSession();
    const subtree = new Map<string, { person: Person; children: string[] }>();

    try {
      // Get root person
      const rootResult = await session.run(
        'MATCH (p:Person {id: $rootId}) RETURN p',
        { rootId }
      );

      if (rootResult.records.length > 0) {
        const rootPerson = this.mapNodeToPerson(rootResult.records[0].get('p'));
        subtree.set(rootId, { person: rootPerson, children: [] });
      }

      // Get descendants with depth limit
      const descResult = await session.run(
        `MATCH path = (root:Person {id: $rootId})-[:PARENT_OF*1..${maxDepth}]->(desc:Person)
         WITH root, desc, relationships(path) as rels
         WHERE size(rels) <= $maxDepth
         RETURN root, desc, size(rels) as depth`,
        { rootId, maxDepth }
      );

      for (const record of descResult.records) {
        const childPerson = this.mapNodeToPerson(record.get('desc'));
        subtree.set(childPerson.id, { person: childPerson, children: [] });
      }

      return subtree;
    } finally {
      await session.close();
    }
  }

  async getAllParentChildRelations(): Promise<{ parentId: string; childId: string }[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (parent:Person)-[:PARENT_OF]->(child:Person)
         RETURN parent.id as parentId, child.id as childId`
      );
      return result.records.map(record => ({
        parentId: record.get('parentId'),
        childId: record.get('childId'),
      }));
    } finally {
      await session.close();
    }
  }

  async getAllSpouseRelations(): Promise<{ personId: string; spouseId: string }[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p1:Person)-[:MARRIED_TO]->(p2:Person)
         RETURN p1.id as personId, p2.id as spouseId`
      );
      return result.records.map(record => ({
        personId: record.get('personId'),
        spouseId: record.get('spouseId'),
      }));
    } finally {
      await session.close();
    }
  }

  private mapNodeToPerson(node: any): Person {
    const props = node.properties;
    return {
      id: props.id,
      firstName: props.firstName || '',
      middleName: props.middleName,
      lastName: props.lastName || '',
      maidenName: props.maidenName,
      gender: props.gender || 'unknown',
      birthDate: props.birthDate,
      deathDate: props.deathDate,
      birthPlace: props.birthPlace,
      deathPlace: props.deathPlace,
      photo: props.photo,
      bio: props.bio,
      notes: props.notes,
      generation: props.generation || 0,
      createdAt: props.createdAt?.toString() || new Date().toISOString(),
      updatedAt: props.updatedAt?.toString() || new Date().toISOString(),
    };
  }
}