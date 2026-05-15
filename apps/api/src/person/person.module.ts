import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonResolver } from './person.resolver';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [Neo4jModule, AuthModule],
  providers: [PersonService, PersonResolver],
  exports: [PersonService],
})
export class PersonModule {}
