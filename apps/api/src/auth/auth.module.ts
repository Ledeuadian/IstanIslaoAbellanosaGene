// ===========================================
// AUTH MODULE
// ===========================================

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [AuthService, AuthResolver],
  exports: [AuthService, AuthResolver],
})
export class AuthModule {}