// ==========================================
// PERSON SERVICE
// ==========================================

import { Injectable, Inject } from '@nestjs/common';
import { NEO4J_DRIVER } from '../neo4j/neo4j.module';
import type { Driver, Session } from 'neo4j-driver';

export interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  photo?: string;
  bio?: string;
  notes?: string;
  generation: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PersonService {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  private getSession(): Session {
    return this.driver.session();
  }

  async findAll(): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        'MATCH (p:Person) RETURN p ORDER BY p.generation, p.lastName'
      );
      return result.records.map((record) => {
        const node = record.get('p');
        return this.mapNodeToPerson(node);
      });
    } finally {
      await session.close();
    }
  }

  async findOne(id: string): Promise<Person | null> {
    const session = this.getSession();
    try {
      const result = await session.run(
        'MATCH (p:Person {id: $id}) RETURN p',
        { id }
      );
      if (result.records.length === 0) return null;
      return this.mapNodeToPerson(result.records[0].get('p'));
    } finally {
      await session.close();
    }
  }

  async findChildren(parentId: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $parentId})-[:PARENT_OF]->(child:Person)
         RETURN child`,
        { parentId }
      );
      return result.records.map((record) =>
        this.mapNodeToPerson(record.get('child'))
      );
    } finally {
      await session.close();
    }
  }

  async findParents(childId: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (parent:Person)-[:PARENT_OF]->(c:Person {id: $childId})
         RETURN parent`,
        { childId }
      );
      return result.records.map((record) =>
        this.mapNodeToPerson(record.get('parent'))
      );
    } finally {
      await session.close();
    }
  }

  async findSpouses(personId: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $personId})-[:MARRIED_TO]->(spouse:Person)
         RETURN spouse`,
        { personId }
      );
      return result.records.map((record) =>
        this.mapNodeToPerson(record.get('spouse'))
      );
    } finally {
      await session.close();
    }
  }

  async findSiblings(personId: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $personId})-[:CHILD_OF]->(family:Family)<-[:CHILD_OF]-(sibling:Person)
         WHERE sibling.id <> $personId
         RETURN sibling`,
        { personId }
      );
      return result.records.map((record) =>
        this.mapNodeToPerson(record.get('sibling'))
      );
    } finally {
      await session.close();
    }
  }

  async getAllDescendants(rootId: string, maxDepth: number = 10): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH path = (root:Person {id: $rootId})-[:PARENT_OF*1..${maxDepth}]->(descendant:Person)
         RETURN descendant`,
        { rootId }
      );
      return result.records.map((record) =>
        this.mapNodeToPerson(record.get('descendant'))
      );
    } finally {
      await session.close();
    }
  }

  async create(input: Partial<Person>): Promise<Person> {
    const session = this.getSession();
    try {
      const id = input.id || this.generateId();
      
      console.log('[PersonService] create called with input:', JSON.stringify(input, null, 2));
      console.log('[PersonService] positionX:', input.positionX);
      console.log('[PersonService] positionY:', input.positionY);
      console.log('[PersonService] positionZ:', input.positionZ);
      
      const result = await session.run(
        `CREATE (p:Person {
          id: $id,
          firstName: $firstName,
          middleName: $middleName,
          lastName: $lastName,
          maidenName: $maidenName,
          gender: $gender,
          birthDate: $birthDate,
          deathDate: $deathDate,
          birthPlace: $birthPlace,
          deathPlace: $deathPlace,
          photo: $photo,
          bio: $bio,
          generation: $generation,
          positionX: $positionX,
          positionY: $positionY,
          positionZ: $positionZ,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        RETURN p`,
        {
          id,
          firstName: input.firstName || '',
          middleName: input.middleName || '',
          lastName: input.lastName || '',
          maidenName: input.maidenName || '',
          gender: input.gender || 'unknown',
          birthDate: input.birthDate || null,
          deathDate: input.deathDate || null,
          birthPlace: input.birthPlace || '',
          deathPlace: input.deathPlace || '',
          photo: input.photo || '',
          bio: input.bio || '',
          generation: input.generation || 0,
          positionX: input.positionX ?? null,
          positionY: input.positionY ?? null,
          positionZ: input.positionZ ?? null,
        }
      );
      return this.mapNodeToPerson(result.records[0].get('p'));
    } finally {
      await session.close();
    }
  }

  async update(id: string, input: Partial<Person>): Promise<Person | null> {
    const session = this.getSession();
    try {
      const updates: string[] = [];
      const params: Record<string, any> = { id };

      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`p.${key} = $${key}`);
          params[key] = value;
        }
      });

      if (updates.length === 0) {
        return this.findOne(id);
      }

      updates.push('p.updatedAt = datetime()');
      const result = await session.run(
        `MATCH (p:Person {id: $id})
         SET ${updates.join(', ')}
         RETURN p`,
        params
      );

      if (result.records.length === 0) return null;
      return this.mapNodeToPerson(result.records[0].get('p'));
    } finally {
      await session.close();
    }
  }

  async delete(id: string): Promise<boolean> {
    const session = this.getSession();
    try {
      const result = await session.run(
        'MATCH (p:Person {id: $id}) DETACH DELETE p RETURN count(*) as count',
        { id }
      );
      return result.records[0].get('count') > 0;
    } finally {
      await session.close();
    }
  }

  async addParent(parentId: string, childId: string, type: string = 'biological'): Promise<boolean> {
    const session = this.getSession();
    try {
      await session.run(
        `MATCH (parent:Person {id: $parentId}), (child:Person {id: $childId})
         CREATE (parent)-[:PARENT_OF {type: $type}]->(child)`,
        { parentId, childId, type }
      );
      return true;
    } finally {
      await session.close();
    }
  }

  async addSpouse(personId: string, spouseId: string, type: string = 'married'): Promise<boolean> {
    const session = this.getSession();
    try {
      await session.run(
        `MATCH (p1:Person {id: $personId}), (p2:Person {id: $spouseId})
         CREATE (p1)-[:MARRIED_TO {type: $type}]->(p2)
         CREATE (p2)-[:MARRIED_TO {type: $type}]->(p1)`,
        { personId, spouseId, type }
      );
      return true;
    } finally {
      await session.close();
    }
  }

  async search(query: string): Promise<Person[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person)
         WHERE p.firstName CONTAINS $query
            OR p.lastName CONTAINS $query
            OR p.middleName CONTAINS $query
         RETURN p
         LIMIT 20`,
        { query }
      );
      return result.records.map((record) =>
        this.mapNodeToPerson(record.get('p'))
      );
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
      positionX: props.positionX,
      positionY: props.positionY,
      positionZ: props.positionZ,
      createdAt: props.createdAt?.toString() || new Date().toISOString(),
      updatedAt: props.updatedAt?.toString() || new Date().toISOString(),
    };
  }

  private generateId(): string {
    return `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
