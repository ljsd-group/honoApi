import { pgTable, varchar, serial, timestamp, text, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';

// 定义Users表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// 定义Accounts表 - 基于Auth0用户信息
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id), // 关联到users表，可选
  auth0_sub: varchar('auth0_sub', { length: 255 }).notNull().unique(), // Auth0唯一标识符
  name: varchar('name', { length: 100 }),
  nickname: varchar('nickname', { length: 100 }),
  email: varchar('email', { length: 255 }),
  email_verified: boolean('email_verified').default(false),
  picture: varchar('picture', { length: 1000 }),
  device_number: varchar('device_number', { length: 255 }), // 设备号，不再需要
  loginType: integer('login_type').default(1), // 登录类型：1=Apple，2=Google
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// 定义设备表 - 存储设备信息
export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  device_number: varchar('device_number', { length: 255 }).notNull().unique(), // 设备唯一标识符
  phone_model: varchar('phone_model', { length: 100 }), // 设备型号
  country_code: varchar('country_code', { length: 10 }), // 国家代码
  version: varchar('version', { length: 20 }), // 应用版本
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// 定义设备账户关联表 - 实现设备和账户的多对多关系
export const deviceAccounts = pgTable('device_accounts', {
  account_id: integer('account_id').notNull().references(() => accounts.id),
  device_id: integer('device_id').notNull().references(() => devices.id),
  is_active: boolean('is_active').default(true), // 是否为活跃关联
  last_login: timestamp('last_login').defaultNow(), // 最后登录时间
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.account_id, table.device_id] }), // 复合主键
  }
}); 