import { createDbClient } from './config';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function dropDeviceNumberColumn() {
  try {
    // 获取数据库连接
    const db = createDbClient('postgres://pguser:123456@localhost:5432/honostudy');
    
    console.log('开始删除accounts表中device_number字段...');
    
    // 检查字段是否存在
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'accounts' 
        AND column_name = 'device_number';
    `);
    
    if (checkResult.length === 0) {
      console.log('device_number字段不存在，无需删除');
      process.exit(0);
      return;
    }
    
    // 执行SQL命令删除字段
    await db.execute(sql`ALTER TABLE "accounts" DROP COLUMN "device_number";`);
    
    console.log('device_number字段删除成功！');
    
    // 检查字段是否已删除
    const verifyResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'accounts' 
        AND column_name = 'device_number';
    `);
    
    if (verifyResult.length === 0) {
      console.log('确认：device_number字段已成功删除');
    } else {
      console.log('警告：device_number字段可能未被删除');
    }
    
    // 还需要修改findSubscribeProxy.ts文件中的device_number相关代码
    console.log('提示：请记得修改findSubscribeProxy.ts文件中的device_number相关代码');
    
    process.exit(0);
  } catch (error) {
    console.error('删除device_number字段时发生错误:', error);
    process.exit(1);
  }
}

// 执行函数
dropDeviceNumberColumn(); 