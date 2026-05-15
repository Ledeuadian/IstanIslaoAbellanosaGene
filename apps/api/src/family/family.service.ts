import { Injectable, Inject } from '@nestjs/common';
import { NEO4J_DRIVER } from '../neo4j/neo4j.module';
import type { Driver, Session } from 'neo4j-driver';

export interface Family {
  id: string;
  name?: string;
  createdAt: string;
}

@Injectable()
export class FamilyService {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  private getSession(): Session {
    return this.driver.session();
  }

  async findAll(): Promise<Family[]> {
    const session = this.getSession();
    try {
      const result = await session.run('MATCH (f:Family) RETURN f');
      return result.records.map((record) => this.mapNodeToFamily(record.get('f')));
    } finally {
      await session.close();
    }
  }

  async findOne(id: string): Promise<Family | null> {
    const session = this.getSession();
    try {
      const result = await session.run('MATCH (f:Family {id: $id}) RETURN f', { id });
      if (result.records.length === 0) return null;
      return this.mapNodeToFamily(result.records[0].get('f'));
    } finally {
      await session.close();
    }
  }

  async findFamiliesForPerson(personId: string): Promise<Family[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        'MATCH (p:Person {id: $personId})-[:CHILD_OF]->(f:Family) RETURN f',
        { personId }
      );
      return result.records.map((record) => this.mapNodeToFamily(record.get('f')));
    } finally {
      await session.close();
    }
  }

  async create(input: { name?: string }): Promise<Family> {
    const session = this.getSession();
    try {
      const id = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const result = await session.run(
        `CREATE (f:Family {
          id: $id,
          name: $name,
          createdAt: datetime()
        })
        RETURN f`,
        { id, name: input.name || null }
      );
      return this.mapNodeToFamily(result.records[0].get('f'));
    } finally {
      await session.close();
    }
  }

  async delete(id: string): Promise<boolean> {
    const session = this.getSession();
    try {
      await session.run('MATCH (f:Family {id: $id}) DETACH DELETE f', { id });
      return true;
    } finally {
      await session.close();
    }
  }

  private mapNodeToFamily(node: any): Family {
    const props = node.properties;
    return {
      id: props.id,
      name: props.name,
      createdAt: props.createdAt?.toString() || new Date().toISOString(),
    };
  }
}
