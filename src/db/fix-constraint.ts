import { createDbClient } from './config';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function dropConstraint() {
  try {
    // 获取数据库连接
    const db = createDbClient('postgres://pguser:123456@localhost:5432/honostudy');
    
    console.log('正在删除accounts表中auth0_sub字段的唯一约束...');
    
    // 执行SQL命令删除约束
    await db.execute(sql`ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_auth0_sub_unique";`);
    
    console.log('约束删除成功！');
    
    // 检查约束是否已删除
    const result = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'accounts' 
        AND constraint_name = 'accounts_auth0_sub_unique';
    `);
    
    if (result.length === 0) {
      console.log('确认：约束已成功删除');
    } else {
      console.log('警告：约束可能未被删除');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('删除约束时发生错误:', error);
    process.exit(1);
  }
}

// 执行函数
dropConstraint(); 