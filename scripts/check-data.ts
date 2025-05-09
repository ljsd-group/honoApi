import { db, pgPool } from '../src/config/database';
import { tasks, users } from '../src/db/schema';

async function checkData() {
  console.log('Checking database data...');

  try {
    // 查询所有用户（不显示密码）
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      created_at: users.created_at,
      updated_at: users.updated_at
    }).from(users);

    console.log('\n=== 用户数据 ===');
    console.log(`共 ${allUsers.length} 条用户记录：`);
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}`);
    });

    // 查询所有任务
    const allTasks = await db.select().from(tasks);

    console.log('\n=== 任务数据 ===');
    console.log(`共 ${allTasks.length} 条任务记录：`);
    
    // 按状态分类统计
    const statusCount = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      other: 0
    };
    
    allTasks.forEach(task => {
      if (task.status === 'pending') statusCount.pending++;
      else if (task.status === 'in-progress') statusCount['in-progress']++;
      else if (task.status === 'completed') statusCount.completed++;
      else statusCount.other++;
      
      console.log(`ID: ${task.id}, 标题: ${task.title}, 状态: ${task.status}`);
    });
    
    console.log('\n=== 任务状态统计 ===');
    console.log(`待处理: ${statusCount.pending}`);
    console.log(`进行中: ${statusCount['in-progress']}`);
    console.log(`已完成: ${statusCount.completed}`);
    if (statusCount.other > 0) {
      console.log(`其他状态: ${statusCount.other}`);
    }

  } catch (error) {
    console.error('查询数据失败:', error);
  } finally {
    // 关闭连接
    await pgPool.end();
  }
}

// 执行查询
checkData().catch(console.error); 