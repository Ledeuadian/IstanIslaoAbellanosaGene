// ==========================================
// TREE MODULE - Hierarchical Tree Queries
// ==========================================

import { Module } from '@nestjs/common';
import { TreeService } from './tree.service';
import { TreeResolver } from './tree.resolver';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [TreeService, TreeResolver],
  exports: [TreeService],
})
export class TreeModule {}