// ==========================================
// NEO4J CONNECTION MODULE
// ==========================================

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

export const NEO4J_DRIVER = 'NEO4J_DRIVER';

@Global()
@Module({
  providers: [
    {
      provide: NEO4J_DRIVER,
      useFactory: (configService: ConfigService) => {
        const uri = configService.get('NEO4J_URI', 'bolt://localhost:7687');
        const user = configService.get('NEO4J_USERNAME', 'neo4j');
        const password = configService.get('NEO4J_PASSWORD', 'password');

        // Configure for Neo4j AuraDB (cloud)
        // neo4j+s:// URI scheme handles TLS/encryption automatically
        const driver = neo4j.driver(
          uri,
          neo4j.auth.basic(user, password),
          {
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 30000,
          }
        );
        console.log('🔌 Connected to Neo4j:', uri.replace(/\+s/, ''));

        return driver;
      },
      inject: [ConfigService],
    },
  ],
  exports: [NEO4J_DRIVER],
})
export class Neo4jModule {}
