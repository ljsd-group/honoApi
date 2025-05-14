import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function addLoginTypeField() {
  console.log('开始向accounts表添加login_type字段...');

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
    const sqlFilePath = path.join(process.cwd(), 'src/db/migrations/add_login_type_to_accounts.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // 执行SQL脚本
    await pool.query(sqlScript);
    
    console.log('成功向accounts表添加login_type字段');
    console.log('字段迁移完成！');
  } catch (error) {
    console.error('执行迁移脚本出错:', error);
  } finally {
    // 关闭连接
    await pool.end();
  }
}

// 执行迁移
addLoginTypeField().catch(console.error); 