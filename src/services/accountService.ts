import { db } from '../config/database';
import { accounts, users, deviceAccounts, devices } from '../db/schema';
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
  app_id?: number;
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
      throw error;
    }
  }
  
  // 根据设备号查找设备
  async findDeviceByNumber(deviceNumber: string) {
    try {
      const result = await db.select()
        .from(devices)
        .where(eq(devices.device_number, deviceNumber))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // 根据账户ID和设备ID查找关联
  async findDeviceAccountRelation(accountId: number, deviceId: number) {
    try {
      const result = await db.select()
        .from(deviceAccounts)
        .where(
          and(
            eq(deviceAccounts.account_id, accountId),
            eq(deviceAccounts.device_id, deviceId)
          )
        )
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
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
      throw error;
    }
  }
  
  // 更新账户
  async updateAccount(accountData: Omit<Account, 'id'> & { id: number }) {
    try {
      await db.update(accounts)
        .set({
          auth0_sub: accountData.auth0_sub,
          name: accountData.name,
          nickname: accountData.nickname,
          email: accountData.email,
          email_verified: accountData.email_verified,
          picture: accountData.picture,
          app_id: accountData.app_id,
          updated_at: new Date()
        })
        .where(eq(accounts.id, accountData.id));
      
      return accountData;
    } catch (error) {
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
      throw error;
    }
  }
  
  // 直接使用auth0_sub解除设备关联(重写的方法)
  async unBindDeviceByAuth0Sub(auth0Sub: string, deviceNumber: string) {
    try {
      
      // 查找账户
      const account = await this.findAccountByAuth0Sub(auth0Sub);
      
      if (!account || !account.id) {
        return { success: false, message: '未找到匹配的账户' };
      }
      
      // 查找设备
      const device = await this.findDeviceByNumber(deviceNumber);

      if (!device || !device.id) {
        return { success: false, message: '未找到匹配的设备' };
      }
      
      // 查找设备和账户的关联记录
      const relation = await this.findDeviceAccountRelation(account.id, device.id);

      
      if (!relation) {
        return { success: false, message: '设备与账户未关联' };
      }
      
      // 使用事务保证操作的原子性
      return await db.transaction(async (trx) => {

        
        // 1. 先删除该账户的所有设备关联记录
        console.log(`准备删除账户的所有关联记录: accountId=${account.id}`);        const relationResult = await trx.delete(deviceAccounts)
          .where(eq(deviceAccounts.account_id, account.id))
          .returning();
        
        const relationDeletedCount = relationResult.length;

        // 2. 删除账户记录
        const accountResult = await trx.delete(accounts)
          .where(eq(accounts.id, account.id))
          .returning();
        
        const accountDeletedCount = accountResult.length;
        return { 
          success: true, 
          message: `成功删除账户及其所有关联记录`,
          relationDeletedCount,
          accountDeletedCount,
          accountId: account.id,
          deviceId: device.id
        };
      });
    } catch (error) {
      console.error('解除设备关联失败:', error);
      // 打印更详细的错误信息
      if (error instanceof Error) {
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      throw error;
    }
  }
} 