// ===========================================
// AUTH SERVICE
// ===========================================

import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { NEO4J_DRIVER } from '../neo4j/neo4j.module';

interface UserNode {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  role: string;
  createdAt: any;
}

@Injectable()
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly SALT_ROUNDS = 10;

  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  }

  async register(username: string, password: string, email?: string): Promise<{ token: string; user: any }> {
    const session = this.driver.session();
    try {
      // Check if username already exists
      const checkResult = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username }
      );

      if (checkResult.records.length > 0) {
        throw new ConflictException('Username already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

      const id = `user_${uuidv4()}`;
      const now = new Date().toISOString();

      // Create user node
      await session.run(
        `CREATE (u:User {
          id: $id,
          username: $username,
          email: $email,
          passwordHash: $passwordHash,
          role: $role,
          createdAt: $createdAt
        }) RETURN u`,
        { id, username, email: email || null, passwordHash, role: 'viewer', createdAt: now }
      );

      // Return auth payload
      return this.login(username, password);
    } finally {
      await session.close();
    }
  }

  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username }
      );

      if (result.records.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const userNode = result.records[0].get('u');
      const userProps = userNode.properties;
      const passwordHash = userNode.properties.passwordHash;

      // Verify password
      const isValid = await bcrypt.compare(password, passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = {
        id: userProps.id,
        username: userProps.username,
        email: userProps.email,
        role: userProps.role,
        createdAt: userProps.createdAt?.toString(),
      };

      const token = this.generateToken(user);

      return { token, user };
    } finally {
      await session.close();
    }
  }

  async validateUser(userId: string): Promise<any | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {id: $userId}) RETURN u',
        { userId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const userProps = result.records[0].get('u').properties;
      return {
        id: userProps.id,
        username: userProps.username,
        email: userProps.email,
        role: userProps.role,
        createdAt: userProps.createdAt?.toString(),
      };
    } finally {
      await session.close();
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {id: $userId}) RETURN u',
        { userId }
      );

      if (result.records.length === 0) {
        throw new BadRequestException('User not found');
      }

      const userProps = result.records[0].get('u').properties;

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, userProps.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid old password');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      await session.run(
        'MATCH (u:User {id: $userId}) SET u.passwordHash = $passwordHash',
        { userId, passwordHash: newPasswordHash }
      );

      return true;
    } finally {
      await session.close();
    }
  }

  private generateToken(user: any): string {
    return jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  async decodeToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch {
      return null;
    }
  }
}