import { pgSql, db } from "../config/database";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from 'bcryptjs';

// 定义用户记录类型
export interface UserRecord {
  id: number;
  username: string;
  password: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
}

// 添加一个独立的findUserById函数
export async function findUserById(id: string | number): Promise<any> {
  const userService = new UserService();
  return await userService.getUserById(Number(id));
}

export class UserService {
  // 通过用户名查找用户
  async findByUsername(username: string): Promise<UserRecord | null> {
    try {
      // 使用postgres库的标签模板字符串查询
      const result = await pgSql`
        SELECT * FROM users WHERE username = ${username}
      `;
      
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
      
      let valid = false;
      
      // 首先尝试直接比较（用于测试/开发）
      if (user.password === password) {
        valid = true;
      } 
      // 如果直接比较失败，并且密码以$2b$或$2a$开头（bcrypt哈希），尝试bcrypt比较
      else if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        try {
          // 尝试使用bcrypt比较密码
          valid = await bcrypt.compare(password, user.password);
        } catch (error) {
          console.error('bcrypt比较密码失败:', error);
        }
      }
      
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
      // 使用postgres库的标签模板字符串插入
      const result = await pgSql`
        INSERT INTO users (username, password, email) 
        VALUES (${userData.username}, ${userData.password}, ${userData.email}) 
        RETURNING id
      `;
      
      return result[0].id;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }
  
  // 获取所有用户
  async getAllUsers(): Promise<UserRecord[]> {
    try {
      // 使用postgres库的标签模板字符串查询
      const result = await pgSql`
        SELECT id, username, email, created_at, updated_at FROM users
      `;
      
      return result as unknown as UserRecord[];
    } catch (error) {
      console.error('获取所有用户失败:', error);
      throw error;
    }
  }
  
  // 通过ID获取用户
  async getUserById(id: number): Promise<UserRecord | null> {
    try {
      // 使用postgres库的标签模板字符串查询
      const result = await pgSql`
        SELECT id, username, email, created_at, updated_at 
        FROM users WHERE id = ${id}
      `;
      
      return result.length > 0 ? result[0] as UserRecord : null;
    } catch (error) {
      console.error(`获取用户ID=${id}失败:`, error);
      throw error;
    }
  }
  
  // 哈希密码工具方法
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
} 