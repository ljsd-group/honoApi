import { getDbClient } from './db';
import { Env } from '../types';
import { eq, and } from 'drizzle-orm';
import { accounts, users } from '../db/schema';

// 账户类型定义
export interface Account {
  id?: number;
  auth0_sub: string;
  name?: string;
  nickname?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  app_id?: number;
  device_number?: string;
  login_type?: number;
  phone_model?: string;
  country_code?: string;
  version?: string;
}

// 账户服务类
export class AccountService {
  private db;

  constructor(private env: Env) {
    this.db = getDbClient(env);
  }
  
  // 根据Auth0 sub查找账户
  async findAccountByAuth0Sub(auth0Sub: string) {
    try {
      const result = await this.db.select()
        .from(accounts)
        .where(eq(accounts.auth0_sub, auth0Sub))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('根据Auth0 sub查找账户失败:', error);
      throw error;
    }
  }
  
  // 根据ID查找账户
  async findAccountById(id: number) {
    try {
      const result = await this.db.select()
        .from(accounts)
        .where(eq(accounts.id, id))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('根据ID查找账户失败:', error);
      throw error;
    }
  }
  
  // 根据Auth0 sub和deviceNumber查找账户
  async findAccountByAuth0SubAndDevice(auth0Sub: string, deviceNumber: string) {
    try {
      const result = await this.db.select()
        .from(accounts)
        .where(
          and(
            eq(accounts.auth0_sub, auth0Sub),
            eq(accounts.device_number, deviceNumber)
          )
        )
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('根据Auth0 sub和设备号查找账户失败:', error);
      throw error;
    }
  }
  
  // 根据Auth0 sub和appId查找账户
  async findAccountByAuth0SubAndAppId(auth0Sub: string, appId: number) {
    try {
      const result = await this.db.select()
        .from(accounts)
        .where(
          and(
            eq(accounts.auth0_sub, auth0Sub),
            eq(accounts.app_id, appId)
          )
        )
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('根据Auth0 sub和appId查找账户失败:', error);
      throw error;
    }
  }
  
  // 根据Auth0 sub、appId和deviceNumber查找账户
  async findAccountByAuth0SubAndAppIdAndDevice(auth0Sub: string, appId: number, deviceNumber: string) {
    try {
      const result = await this.db.select()
        .from(accounts)
        .where(
          and(
            eq(accounts.auth0_sub, auth0Sub),
            eq(accounts.app_id, appId),
            eq(accounts.device_number, deviceNumber)
          )
        )
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('根据Auth0 sub、appId和deviceNumber查找账户失败:', error);
      throw error;
    }
  }
  
  // 创建账户
  async createAccount(accountData: Account) {
    try {
      const result = await this.db.insert(accounts)
        .values({
          ...accountData
        })
        .returning();
        
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('创建账户失败:', error);
      throw error;
    }
  }
  
  // 更新账户
  async updateAccount(accountData: Omit<Account, 'id'> & { id: number }) {
    try {
      await this.db.update(accounts)
        .set({
          auth0_sub: accountData.auth0_sub,
          name: accountData.name,
          nickname: accountData.nickname,
          email: accountData.email,
          email_verified: accountData.email_verified,
          picture: accountData.picture,
          app_id: accountData.app_id,
          device_number: accountData.device_number,
          login_type: accountData.login_type,
          phone_model: accountData.phone_model,
          country_code: accountData.country_code,
          version: accountData.version
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
        await this.db.update(accounts)
          .set({
            name: accountData.name,
            nickname: accountData.nickname,
            email: accountData.email,
            email_verified: accountData.email_verified,
            picture: accountData.picture,
            device_number: accountData.device_number,
            login_type: accountData.login_type,
            phone_model: accountData.phone_model,
            country_code: accountData.country_code,
            version: accountData.version
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
  
  // 根据Auth0 sub和appId删除账户
  async deleteAccountByAuth0SubAndAppId(auth0Sub: string, appId: number) {
    try {
      const result = await this.db.delete(accounts)
        .where(
          and(
            eq(accounts.auth0_sub, auth0Sub),
            eq(accounts.app_id, appId)
          )
        )
        .returning();
      
      return { success: true, message: '账户删除成功', deletedCount: result.length };
    } catch (error) {
      console.error('删除账户失败:', error);
      return { success: false, message: '删除账户失败: ' + error };
    }
  }
} 