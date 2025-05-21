import { db } from './index';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    // 添加 appId 字段到 accounts 表
    await db.execute(sql`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS app_id INTEGER 
      REFERENCES applications(id);
    `);
    
    console.log('迁移成功：已添加 app_id 字段到 accounts 表');
  } catch (error) {
    console.error('迁移失败：', error);
  }
}

migrate(); 