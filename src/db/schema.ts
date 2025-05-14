import { pgTable, varchar, serial, timestamp, text, integer, boolean } from 'drizzle-orm/pg-core';

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
  device_number: varchar('device_number', { length: 255 }), // 设备号
  loginType: integer('login_type').default(1), // 登录类型：1=Apple，2=Google
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}); 