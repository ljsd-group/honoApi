import { db } from '../config/database';
import { accounts, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// 账户类型定义
export interface Account {
  id?: number;
  user_id?: number;
  auth0_sub: string;
  name?: string;
  nickname?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  device_number?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 账户服务类
export class AccountService {
  
  // 根据Auth0 sub查找账户
  async findAccountByAuth0Sub(auth0Sub: string) {
    try {
      const result = await db.select()
        .from(accounts)
        .where(eq(accounts.auth0_sub, auth0Sub))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('查找账户失败:', error);
      throw error;
    }
  }
  
  // 根据ID查找账户
  async findAccountById(id: number) {
    try {
      const result = await db.select()
        .from(accounts)
        .where(eq(accounts.id, id))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('通过ID查找账户失败:', error);
      throw error;
    }
  }
  
  // 根据设备号查找账户
  async findAccountByDeviceNumber(deviceNumber: string) {
    try {
      const result = await db.select()
        .from(accounts)
        .where(eq(accounts.device_number, deviceNumber))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('通过设备号查找账户失败:', error);
      throw error;
    }
  }
  
  // 根据设备号和Auth0 sub查找账户
  async findAccountByDeviceAndAuth0Sub(deviceNumber: string, auth0Sub: string) {
    try {
      const result = await db.select()
        .from(accounts)
        .where(
          and(
            eq(accounts.device_number, deviceNumber),
            eq(accounts.auth0_sub, auth0Sub)
          )
        )
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('通过设备号和Auth0 sub查找账户失败:', error);
      throw error;
    }
  }
  
  // 创建账户
  async createAccount(accountData: Account) {
    try {
      const result = await db.insert(accounts)
        .values({
          ...accountData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
        
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('创建账户失败:', error);
      throw error;
    }
  }
  
  // 更新账户
  async updateAccount(accountData: Account) {
    try {
      if (!accountData.id) {
        throw new Error('更新账户需要提供账户ID');
      }
      
      await db.update(accounts)
        .set({
          auth0_sub: accountData.auth0_sub,
          name: accountData.name,
          nickname: accountData.nickname,
          email: accountData.email,
          email_verified: accountData.email_verified,
          picture: accountData.picture,
          device_number: accountData.device_number,
          updated_at: new Date()
        })
        .where(eq(accounts.id, accountData.id));
      
      return accountData;
    } catch (error) {
      console.error('更新账户失败:', error);
      throw error;
    }
  }
  
  // 创建或更新账户
  async createOrUpdateAccount(accountData: Account) {
    try {
      // 检查账户是否已存在
      const existingAccount = await this.findAccountByAuth0Sub(accountData.auth0_sub);
      
      if (existingAccount) {
        // 更新账户
        await db.update(accounts)
          .set({
            name: accountData.name,
            nickname: accountData.nickname,
            email: accountData.email,
            email_verified: accountData.email_verified,
            picture: accountData.picture,
            device_number: accountData.device_number,
            updated_at: new Date()
          })
          .where(eq(accounts.auth0_sub, accountData.auth0_sub));
        
        return {
          ...existingAccount,
          ...accountData,
          id: existingAccount.id
        };
      } else {
        // 创建新账户
        return await this.createAccount(accountData);
      }
    } catch (error) {
      console.error('创建或更新账户失败:', error);
      throw error;
    }
  }
  
  // 关联账户到用户
  async linkAccountToUser(accountId: number, userId: number) {
    try {
      await db.update(accounts)
        .set({ user_id: userId })
        .where(eq(accounts.id, accountId));
      
      return true;
    } catch (error) {
      console.error('关联账户到用户失败:', error);
      throw error;
    }
  }
  
  // 更新设备号
  async updateDeviceNumber(accountId: number, deviceNumber: string) {
    try {
      await db.update(accounts)
        .set({ device_number: deviceNumber })
        .where(eq(accounts.id, accountId));
      
      return true;
    } catch (error) {
      console.error('更新设备号失败:', error);
      throw error;
    }
  }
} 