import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// 数据库连接配置
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'pguser',
  password: '123456',
  database: 'honostudy'
};

// PostgreSQL 默认数据库连接配置
const ADMIN_DB_CONFIG = {
  ...DB_CONFIG,
  database: 'postgres' // 默认数据库
};

// 迁移类型
type MigrationType = 'init' | 'users' | 'accounts' | 'login-type' | 'device-accounts' | 'all';

/**
 * 执行SQL文件迁移
 */
async function executeSqlFile(pool: Pool, filePath: string): Promise<void> {
  console.log(`执行SQL文件: ${path.basename(filePath)}`);
  const sqlScript = fs.readFileSync(filePath, 'utf8');
  await pool.query(sqlScript);
}

/**
 * 初始化数据库
 */
async function initDatabase(): Promise<void> {
  console.log('初始化数据库...');
  
  // 连接到默认数据库
  const adminPool = new Pool(ADMIN_DB_CONFIG);

  try {
    // 创建新数据库 - 简化版本，不指定locale
    await adminPool.query(`
      CREATE DATABASE honostudy
      WITH OWNER = pguser
      ENCODING = 'UTF8'
      CONNECTION LIMIT = -1;
    `).catch(error => {
      // 如果数据库已存在，忽略错误
      if (error.code === '42P04') {
        console.log('数据库 honostudy 已存在，将继续执行后续操作');
      } else {
        throw error;
      }
    });

    console.log('成功创建数据库 honostudy');
  } catch (error) {
    console.error('初始化数据库出错:', error);
    throw error;
  } finally {
    await adminPool.end();
  }
}

/**
 * 创建用户表
 */
async function createUsersTable(pool: Pool): Promise<void> {
  console.log('创建用户表...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('成功创建用户表');
}

/**
 * 迁移账户表
 */
async function migrateAccounts(pool: Pool): Promise<void> {
  console.log('开始执行accounts表迁移...');
  
  const sqlFilePath = path.join(process.cwd(), 'src/db/migrations/add_accounts_table.sql');
  await executeSqlFile(pool, sqlFilePath);
  
  console.log('成功创建accounts表及相关索引');
}

/**
 * 添加登录类型字段
 */
async function addLoginType(pool: Pool): Promise<void> {
  console.log('开始向accounts表添加login_type字段...');
  
  const sqlFilePath = path.join(process.cwd(), 'src/db/migrations/add_login_type_to_accounts.sql');
  await executeSqlFile(pool, sqlFilePath);
  
  console.log('成功向accounts表添加login_type字段');
}

/**
 * 迁移设备账户关联表
 */
async function migrateDeviceAccounts(pool: Pool): Promise<void> {
  console.log('开始执行设备账户关联表迁移...');
  
  const sqlFilePath = path.join(process.cwd(), 'src/db/migrations/add_device_accounts_tables.sql');
  await executeSqlFile(pool, sqlFilePath);
  
  console.log('成功创建devices和device_accounts表及相关索引');
  console.log('成功迁移现有账户设备关联数据');
}

/**
 * 执行数据库迁移
 */
async function migrate(type: MigrationType = 'all'): Promise<void> {
  console.log(`开始执行数据库迁移: ${type}`);
  
  // 如果是初始化，需要先创建数据库
  if (type === 'init' || type === 'all') {
    await initDatabase();
  }
  
  // 创建到应用数据库的连接
  const pool = new Pool(DB_CONFIG);
  
  try {
    if (type === 'init' || type === 'users' || type === 'all') {
      await createUsersTable(pool);
    }
    
    if (type === 'accounts' || type === 'all') {
      await migrateAccounts(pool);
    }
    
    if (type === 'login-type' || type === 'all') {
      await addLoginType(pool);
    }
    
    if (type === 'device-accounts' || type === 'all') {
      await migrateDeviceAccounts(pool);
    }
    
    console.log(`${type === 'all' ? '所有' : type}迁移操作完成!`);
  } catch (error) {
    console.error('执行迁移脚本出错:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 从命令行参数获取迁移类型
const migrationType = process.argv[2] as MigrationType || 'all';
migrate(migrationType).catch(console.error); 