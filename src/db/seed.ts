import { db } from './index';
import { applications } from './schema';

async function seed() {
  try {
    // 插入应用数据
    await db.insert(applications).values([
      {
        appName: 'AlgeniusNext',
        domain: 'dev-ez5m18whai32urhj.us.auth0.com'
      },
      {
        appName: 'PicchatBox',
        domain: 'dev-l088mznni36phook.us.auth0.com'
      }
    ]);
    
    console.log('数据插入成功！');
  } catch (error) {
    console.error('插入数据时出错：', error);
  }
}

seed(); 