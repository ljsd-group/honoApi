import { db } from '../config/database';
import { devices, deviceAccounts, accounts } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// 设备类型定义
export interface Device {
  id?: number;
  device_number: string;
  phone_model?: string;
  country_code?: string;
  version?: string;
  loginType?: number;  // 添加登录类型字段：1=Apple，2=Google
  created_at?: Date;
  updated_at?: Date;
}

// 设备账户关联类型定义
export interface DeviceAccount {
  account_id: number;
  device_id: number;
  is_active?: boolean;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// 设备服务类
export class DeviceService {
  
  // 根据设备号查找设备
  async findDeviceByNumber(deviceNumber: string) {
    try {
      const result = await db.select()
        .from(devices)
        .where(eq(devices.device_number, deviceNumber))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('查找设备失败:', error);
      throw error;
    }
  }
  
  // 创建设备
  async createDevice(deviceData: Device) {
    try {
      const result = await db.insert(devices)
        .values({
          ...deviceData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
        
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('创建设备失败:', error);
      throw error;
    }
  }
  
  // 创建或查找设备
  async findOrCreateDevice(deviceNumber: string, phoneModel?: string, countryCode?: string, version?: string, loginType?: number) {
    try {
      // 先查找设备
      let device = await this.findDeviceByNumber(deviceNumber);
      
      // 如果找不到设备，则创建新设备
      if (!device) {
        device = await this.createDevice({
          device_number: deviceNumber,
          phone_model: phoneModel,
          country_code: countryCode,
          version: version,
          loginType: loginType
        });
      } else if (phoneModel || countryCode || version || loginType) {
        // 如果设备存在但提供了额外信息，则更新设备
        await db.update(devices)
          .set({
            phone_model: phoneModel || device.phone_model,
            country_code: countryCode || device.country_code,
            version: version || device.version,
            loginType: loginType !== undefined ? loginType : device.loginType,
            updated_at: new Date()
          })
          .where(eq(devices.id, device.id));
        
        // 重新查询更新后的设备信息
        device = await this.findDeviceByNumber(deviceNumber);
      }
      
      return device;
    } catch (error) {
      console.error('查找或创建设备失败:', error);
      throw error;
    }
  }
  
  // 更新设备登录类型
  async updateDeviceLoginType(deviceId: number, loginType: number) {
    try {
      await db.update(devices)
        .set({
          loginType: loginType,
          updated_at: new Date()
        })
        .where(eq(devices.id, deviceId));
      
      return true;
    } catch (error) {
      console.error('更新设备登录类型失败:', error);
      throw error;
    }
  }
  
  // 关联设备到账户
  async linkDeviceToAccount(deviceId: number, accountId: number) {
    try {
      // 检查是否已有关联
      const existingLink = await db.select()
        .from(deviceAccounts)
        .where(
          and(
            eq(deviceAccounts.device_id, deviceId),
            eq(deviceAccounts.account_id, accountId)
          )
        )
        .limit(1);
      
      if (existingLink.length > 0) {
        // 更新关联的last_login时间和状态
        await db.update(deviceAccounts)
          .set({
            is_active: true,
            last_login: new Date(),
            updated_at: new Date()
          })
          .where(
            and(
              eq(deviceAccounts.device_id, deviceId),
              eq(deviceAccounts.account_id, accountId)
            )
          );
          
        return existingLink[0];
      } else {
        // 创建新关联
        const result = await db.insert(deviceAccounts)
          .values({
            device_id: deviceId,
            account_id: accountId,
            is_active: true,
            last_login: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning();
          
        return result.length > 0 ? result[0] : null;
      }
    } catch (error) {
      console.error('关联设备到账户失败:', error);
      throw error;
    }
  }
  
  // 查找账户的所有设备
  async findDevicesByAccountId(accountId: number) {
    try {
      const result = await db.select({
        device: devices,
        linkInfo: deviceAccounts
      })
        .from(deviceAccounts)
        .innerJoin(devices, eq(deviceAccounts.device_id, devices.id))
        .where(eq(deviceAccounts.account_id, accountId));
      
      return result.map(item => ({
        ...item.device,
        lastLogin: item.linkInfo.last_login,
        isActive: item.linkInfo.is_active
      }));
    } catch (error) {
      console.error('查找账户的设备失败:', error);
      throw error;
    }
  }
  
  // 查找设备的所有账户
  async findAccountsByDeviceNumber(deviceNumber: string) {
    try {
      const device = await this.findDeviceByNumber(deviceNumber);
      
      if (!device) {
        return [];
      }
      
      const result = await db.select({
        account: accounts,
        linkInfo: deviceAccounts
      })
        .from(deviceAccounts)
        .innerJoin(accounts, eq(deviceAccounts.account_id, accounts.id))
        .where(eq(deviceAccounts.device_id, device.id));
      
      return result.map(item => ({
        ...item.account,
        lastLogin: item.linkInfo.last_login,
        isActive: item.linkInfo.is_active
      }));
    } catch (error) {
      console.error('查找设备的账户失败:', error);
      throw error;
    }
  }
} 