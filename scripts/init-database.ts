import { Pool } from 'pg';

// PostgreSQL 连接配置 - 连接到默认数据库以创建新数据库
const adminPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'pguser',
  password: '123456',
  database: 'postgres' // 默认数据库
});

async function initDatabase() {
  console.log('Initializing PostgreSQL database...');

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

    // 连接到新创建的数据库
    const dbPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'pguser',
      password: '123456',
      database: 'honostudy'
    });

    // 创建表
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('成功创建数据表');
    
    // 关闭连接
    await dbPool.end();
    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('初始化数据库出错:', error);
  } finally {
    // 关闭管理员连接
    await adminPool.end();
  }
}

// 执行初始化
initDatabase().catch(console.error); 