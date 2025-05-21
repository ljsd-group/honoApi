import path from 'path';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// 加载环境变量
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// 将 exec 转换为 Promise 形式
const execAsync = promisify(exec);

/**
 * 运行 Drizzle Kit 命令
 * @param command 要运行的命令
 */
async function runDrizzleCommand(command: string): Promise<void> {
  try {
    console.log(`执行命令: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.error(stderr);
    }
  } catch (error) {
    console.error(`执行命令失败: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// 可用的迁移命令
const commands = {
  // 生成迁移文件
  generate: 'npx drizzle-kit generate',
  
  // 推送迁移到数据库
  push: 'npx drizzle-kit push',
  
  // 从数据库拉取模式
  pull: 'npx drizzle-kit pull',
  
  // 检查迁移文件与数据库的差异
  check: 'npx drizzle-kit check',
  
  // 显示 Drizzle Studio UI
  studio: 'npx drizzle-kit studio',
};

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('请提供命令: generate, push, pull, check, studio');
    console.log('例如: npm run db:drizzle generate');
    process.exit(1);
  }
  
  if (!commands[command]) {
    console.error(`未知命令: ${command}`);
    console.log('可用命令: generate, push, pull, check, studio');
    process.exit(1);
  }
  
  await runDrizzleCommand(commands[command]);
}

// 执行主函数
main().catch(err => {
  console.error('执行失败:');
  console.error(err);
  process.exit(1);
}); 