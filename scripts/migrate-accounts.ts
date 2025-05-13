import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function migrateAccounts() {
  console.log('开始执行accounts表迁移...');

  // 连接到数据库
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'pguser',
    password: '123456',
    database: 'honostudy'
  });

  try {
    // 读取SQL迁移文件
    const sqlFilePath = path.join(process.cwd(), 'src/db/migrations/add_accounts_table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // 执行SQL脚本
    await pool.query(sqlScript);
    
    console.log('成功创建accounts表及相关索引');
    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('执行迁移脚本出错:', error);
  } finally {
    // 关闭连接
    await pool.end();
  }
}

// 执行迁移
migrateAccounts().catch(console.error); 