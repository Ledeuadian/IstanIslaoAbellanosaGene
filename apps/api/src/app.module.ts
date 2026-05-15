import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Neo4jModule } from './neo4j/neo4j.module';
import { PersonModule } from './person/person.module';
import { FamilyModule } from './family/family.module';
import { TreeModule } from './tree/tree.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '.env'),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: () => ({
        autoSchemaFile: 'schema.gql',
        sortSchema: true,
        playground: true,
        introspection: true,
        context: ({ req }) => ({ req }),
      }),
      inject: [ConfigService],
    }),
    Neo4jModule,
    PersonModule,
    FamilyModule,
    TreeModule,
    AuthModule,
  ],
})
export class AppModule {}
