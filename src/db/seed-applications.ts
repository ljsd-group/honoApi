import { createDbClient } from './config';
import { applications } from './schema';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const appData = [
    {
        app_name:"AlgeniusNext",
        domain:"dev-ez5m18whai32urhj.us.auth0.com"
    },
    {
        app_name:"PicchatBox",
        domain:"dev-l088mznni36phook.us.auth0.com"
    },
    {
        app_name:"AIMetaAid",
        domain:"dev-aimetaaid.au.auth0.com"
    }
];

async function seedApplications() {
  try {
    const db = createDbClient(process.env.DATABASE_URL || 'postgres://pguser:123456@localhost:5432/honostudy');
    console.log('开始向applications表插入数据...');

    for (const data of appData) {
      await db.insert(applications).values(data).onConflictDoNothing();
      console.log(`已插入或已存在: ${data.app_name}`);
    }

    console.log('数据插入完成！');

    // 验证插入的数据
    const result = await db.select().from(applications);
    console.log('当前applications表中的数据:', result);

    process.exit(0);
  } catch (error) {
    console.error('插入数据时发生错误:', error);
    process.exit(1);
  }
}

seedApplications(); 