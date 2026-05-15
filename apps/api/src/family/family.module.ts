// ==========================================
// FAMILY MODULE
// Handles family groups and relationships
// ==========================================

import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyResolver } from './family.resolver';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [Neo4jModule, AuthModule],
  providers: [FamilyService, FamilyResolver],
  exports: [FamilyService],
})
export class FamilyModule {}
