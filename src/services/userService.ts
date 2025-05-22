import { getDbClient } from './db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Env } from '../types';

// 定义用户记录类型
export interface UserRecord {
  id: number;
  username: string;
  password: string;
  email: string;
  role?: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  role?: string;
}

// 添加一个独立的findUserById函数供中间件使用
export async function findUserById(id: string | number, env: Env): Promise<any> {
  const userService = new UserService(env);
  return await userService.getUserById(Number(id));
}

export class UserService {
  private db;

  constructor(private env: Env) {
    this.db = getDbClient(env);
  }

  // 通过用户名查找用户
  async findByUsername(username: string): Promise<UserRecord | null> {
    try {
      const result = await this.db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      return result.length > 0 ? result[0] as UserRecord : null;
    } catch (error) {
      console.error(`查找用户${username}失败:`, error);
      throw error;
    }
  }
  
  // 验证用户凭据
  async validateUser(username: string, password: string): Promise<{ valid: boolean, user: UserRecord | null }> {
    try {
      const user = await this.findByUsername(username);
      
      if (!user) {
        return { valid: false, user: null };
      }
      
      // 在实际环境中，应该使用bcrypt等库来比较哈希密码
      // 但Cloudflare Workers环境可能存在限制，这里简化为直接比较
      const valid = user.password === password;
      
      return { 
        valid, 
        user: valid ? user : null 
      };
    } catch (error) {
      console.error('验证用户失败:', error);
      throw error;
    }
  }
  
  // 创建新用户
  async createUser(userData: User): Promise<number> {
    try {
      const result = await this.db.insert(users)
        .values({
          username: userData.username,
          password: userData.password || '',
          email: userData.email,
          role: userData.role || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .returning();
      
      return result[0].id;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }
  
  // 获取所有用户
  async getAllUsers(): Promise<UserRecord[]> {
    try {
      const result = await this.db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at
      })
      .from(users);
      
      return result as UserRecord[];
    } catch (error) {
      console.error('获取所有用户失败:', error);
      throw error;
    }
  }
  
  // 通过ID获取用户
  async getUserById(id: number): Promise<UserRecord | null> {
    try {
      const result = await this.db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
      
      return result.length > 0 ? result[0] as UserRecord : null;
    } catch (error) {
      console.error(`获取用户ID=${id}失败:`, error);
      throw error;
    }
  }
} 