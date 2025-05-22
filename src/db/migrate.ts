import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// 执行数据库迁移
export async function runMigration(databaseUrl: string) {
  console.log('开始执行数据库迁移...');
  
  // 创建数据库连接
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);
  
  try {
    // 检查devices表是否已存在
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
      );
    `);
    
    const devicesTableExists = tableExists[0]?.exists;
    
    if (devicesTableExists) {
      console.log('找到devices表，检查列结构...');
      
      // 检查device_token列是否存在
      const columnExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'devices' 
          AND column_name = 'device_token'
        );
      `);
      
      const deviceTokenExists = columnExists[0]?.exists;
      
      if (deviceTokenExists) {
        console.log('找到device_token列，执行特殊迁移...');
        
        // 如果device_token列存在，进行安全的迁移
        try {
          // 由于我们不再需要该列，可以选择删除它
          // 注意：在生产环境中执行此操作前应备份数据
          await db.execute(sql`
            ALTER TABLE devices DROP COLUMN IF EXISTS device_token;
          `);
          console.log('成功移除device_token列');
        } catch (err) {
          console.error('移除device_token列时出错:', err);
          throw err;
        }
      } else {
        console.log('device_token列不存在，无需特殊迁移');
      }
    } else {
      console.log('devices表不存在，将通过正常迁移创建');
    }
    
    // 运行标准迁移
    console.log('执行Drizzle标准迁移...');
    await migrate(db, { migrationsFolder: './migrations' });
    
    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    throw error;
  } finally {
    // 关闭数据库连接
    await client.end();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('错误: 未设置DATABASE_URL环境变量');
    process.exit(1);
  }
  
  runMigration(databaseUrl)
    .then(() => {
      console.log('迁移脚本执行成功');
      process.exit(0);
    })
    .catch((err) => {
      console.error('迁移脚本执行失败:', err);
      process.exit(1);
    });
} 