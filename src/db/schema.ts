import { pgTable, varchar, serial, timestamp, text, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 定义应用表
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  app_name: varchar('app_name', { length: 100 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  created_at: integer('created_at').default(sql`EXTRACT(epoch FROM CURRENT_TIMESTAMP)`).notNull(),
  updated_at: integer('updated_at').default(sql`EXTRACT(epoch FROM CURRENT_TIMESTAMP)`).notNull()
});

// 定义Users表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 20 }).default('user'),
  appId: integer('app_id').references(() => applications.id),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow()
});

// 定义Accounts表 - 基于Auth0用户信息
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  auth0_sub: varchar('auth0_sub', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }),
  nickname: varchar('nickname', { length: 100 }),
  email: varchar('email', { length: 255 }),
  email_verified: boolean('email_verified').default(false),
  picture: varchar('picture', { length: 1000 }),
  app_id: integer('app_id').references(() => applications.id),
  device_number: varchar('device_number', { length: 255 }),
  login_type: integer('login_type').default(1), // 登录类型：1=Apple, 2=Google
  phone_model: varchar('phone_model', { length: 100 }),
  country_code: varchar('country_code', { length: 50 }),
  version: varchar('version', { length: 50 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow()
}); 