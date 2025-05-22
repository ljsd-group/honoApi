import { getDbClient } from './db';
import { Env } from '../types';
import { eq, and, desc, sql } from 'drizzle-orm';
import { devices, deviceAccounts, accounts } from '../db/schema';

// 设备类型定义
export interface Device {
  id?: number;
  device_number: string;
  phone_model?: string;
  country_code?: string;
  version?: string;
  login_type?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// 设备服务类
export class DeviceService {
  private db;

  constructor(private env: Env) {
    this.db = getDbClient(env);
  }
  
  // 根据设备编号查找设备
  async findDeviceByNumber(deviceNumber: string) {
    try {
      console.log("查找设备:", deviceNumber);
      const result = await this.db.select()
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
      const result = await this.db.insert(devices)
        .values({
          ...deviceData,
          is_active: true,
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
  
  // 更新设备
  async updateDevice(deviceData: Omit<Device, 'id'> & { id: number }) {
    try {
      const result = await this.db.update(devices)
        .set({
          phone_model: deviceData.phone_model,
          country_code: deviceData.country_code,
          version: deviceData.version,
          login_type: deviceData.login_type,
          updated_at: new Date()
        })
        .where(eq(devices.id, deviceData.id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('更新设备失败:', error);
      throw error;
    }
  }
  
  // 创建或更新设备
  async createOrUpdateDevice(deviceData: Device) {
    try {
      // 检查设备是否已存在
      const existingDevice = await this.findDeviceByNumber(deviceData.device_number);
      
      if (existingDevice) {
        // 更新设备
        const updatedDevice = await this.updateDevice({
          ...deviceData,
          id: existingDevice.id
        });
        
        return updatedDevice;
      } else {
        // 创建新设备
        return await this.createDevice(deviceData);
      }
    } catch (error) {
      console.error('创建或更新设备失败:', error);
      throw error;
    }
  }
  
  // 绑定设备到账户
  async bindDeviceToAccount(deviceId: number, accountId: number) {
    try {
      // 检查关联是否已存在
      const existingRelation = await this.db.select()
        .from(deviceAccounts)
        .where(
          and(
            eq(deviceAccounts.device_id, deviceId),
            eq(deviceAccounts.account_id, accountId)
          )
        )
        .limit(1);
      
      if (existingRelation.length > 0) {
        // 更新最后登录时间
        const result = await this.db.update(deviceAccounts)
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
          )
          .returning();
        
        return result.length > 0 ? result[0] : existingRelation[0];
      }
      
      // 创建新的关联
      const result = await this.db.insert(deviceAccounts)
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
    } catch (error) {
      console.error('绑定设备到账户失败:', error);
      throw error;
    }
  }
  
  // 获取账户绑定的所有设备
  async getDevicesByAccountId(accountId: number) {
    try {
      const result = await this.db.select({
        device: devices,
        bindTime: deviceAccounts.created_at
      })
        .from(devices)
        .innerJoin(
          deviceAccounts,
          eq(devices.id, deviceAccounts.device_id)
        )
        .where(eq(deviceAccounts.account_id, accountId))
        .orderBy(desc(deviceAccounts.created_at));
      
      return result.map(item => ({
        ...item.device,
        bindTime: item.bindTime
      }));
    } catch (error) {
      console.error('获取账户绑定设备失败:', error);
      throw error;
    }
  }
  
  // 获取设备绑定的账户信息
  async getAccountsByDeviceId(deviceId: number) {
    try {
      const result = await this.db.select({
        account: accounts,
        bindTime: deviceAccounts.created_at
      })
        .from(accounts)
        .innerJoin(
          deviceAccounts,
          eq(accounts.id, deviceAccounts.account_id)
        )
        .where(eq(deviceAccounts.device_id, deviceId))
        .orderBy(desc(deviceAccounts.created_at));
      
      return result.map(item => ({
        ...item.account,
        bindTime: item.bindTime
      }));
    } catch (error) {
      console.error('获取设备绑定账户失败:', error);
      throw error;
    }
  }
} 