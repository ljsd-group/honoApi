import { createDbClient } from './config';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function updateTimestampColumns() {
  try {
    // 获取数据库连接
    const db = createDbClient('postgres://pguser:123456@localhost:5432/honostudy');
    
    console.log('开始更新users和accounts表的时间戳字段...');
    
    // 更新users表的时间戳字段
    await db.execute(sql`
      ALTER TABLE "users" 
      ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone,
      ALTER COLUMN "created_at" SET DEFAULT now(),
      ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone,
      ALTER COLUMN "updated_at" SET DEFAULT now();
    `);
    
    console.log('users表时间戳字段更新成功！');
    
    // 更新accounts表的时间戳字段
    await db.execute(sql`
      ALTER TABLE "accounts" 
      ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone,
      ALTER COLUMN "created_at" SET DEFAULT now(),
      ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone,
      ALTER COLUMN "updated_at" SET DEFAULT now();
    `);
    
    console.log('accounts表时间戳字段更新成功！');
    
    // 验证更新是否成功
    const usersResult = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('created_at', 'updated_at');
    `);
    
    const accountsResult = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'accounts'
      AND column_name IN ('created_at', 'updated_at');
    `);
    
    console.log('验证结果：');
    console.log('users表字段信息:', usersResult);
    console.log('accounts表字段信息:', accountsResult);
    
    process.exit(0);
  } catch (error) {
    console.error('更新时间戳字段时发生错误:', error);
    process.exit(1);
  }
}

// 执行函数
updateTimestampColumns(); 