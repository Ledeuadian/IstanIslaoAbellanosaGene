// ==========================================
// NEO4J ADMIN PASSWORD UPDATE SCRIPT
// Only updates the admin user password - does NOT modify family tree data
// ==========================================

import 'dotenv/config';
import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

async function updateAdminPassword() {
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
      maxConnectionPoolSize: 10,
      connectionAcquisitionTimeout: 30000,
    }
  );
  const session = driver.session();

  console.log('Updating admin password...');
  console.log('URI:', NEO4J_URI.replace(/\+s/, ''));

  try {
    // Delete existing admin user
    console.log('Removing existing admin user...');
    await session.run('MATCH (u:User {username: $username}) DELETE u', { username: 'admin' });

    // Create new admin user with new password
    console.log('Creating admin user with new password...');
    await session.run(`
      CREATE (u:User {
        id: randomUUID(),
        username: 'admin',
        passwordHash: '$2b$10$xi24AdQLuq9HBFUSy543u.VmriKi5y0/O3oyW9.ts33zLsNSTkFLS',
        email: 'admin@abellanosafamily.local',
        role: 'admin',
        createdAt: datetime(),
        updatedAt: datetime()
      })
    `);
    
    console.log('');
    console.log('Admin password updated successfully!');
    console.log('Username: admin');
    console.log('Password: abellanosaA1800');

  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await session.close();
    await driver.close();
    process.exit(0);
  }
}

updateAdminPassword();
