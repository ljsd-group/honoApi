import path from 'path';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

// 检查文件是否存在
const prodEnvPath = path.resolve(process.cwd(), '.env.production');
const fileExists = fs.existsSync(prodEnvPath);
console.log(`${fileExists ? '✓' : '✗'} .env.production 文件${fileExists ? '存在' : '不存在'}`);

// 加载环境变量
// 首先加载 .env.production 文件，如果存在的话
const envResult = dotenv.config({ path: prodEnvPath });
if (envResult.error) {
  console.log('ℹ️ 将使用系统环境变量');
} else {
  console.log('✓ 已加载 .env.production 文件');
}

// 将 exec 转换为 Promise 形式
const execAsync = promisify(exec);

/**
 * 运行 Drizzle Kit 命令
 * @param command 要运行的命令
 */
async function runDrizzleCommand(command: string): Promise<void> {
  try {
    console.log(`执行命令: ${command}`);
    console.log('开始时间:', new Date().toLocaleTimeString());
    
    // 使用超时保护，避免命令永久挂起
    const timeout = 600000; // 10分钟超时
    
    // 创建一个超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`命令执行超时（${timeout/1000}秒）`));
      }, timeout);
    });
    
    // 创建进度报告定时器
    let progress = 0;
    const progressTimer = setInterval(() => {
      progress += 30;
      console.log(`命令执行中... (已等待 ${progress} 秒)`);
    }, 30000); // 每30秒报告一次进度
    
    try {
      // 创建命令执行Promise
      const execPromise = execAsync(command, { 
        env: { 
          ...process.env,
          // 更多的调试信息
          DEBUG: 'drizzle*,pg*,postgres*',
          NODE_DEBUG: 'http,net,tls,module,timers',
          NODE_TLS_REJECT_UNAUTHORIZED: '0', // 注意：仅用于调试，不要在生产中使用
        },
        maxBuffer: 100 * 1024 * 1024 // 100MB 缓冲区
      });
      
      // 使用Promise.race在命令执行或超时发生时返回
      const result = await Promise.race([
        execPromise,
        timeoutPromise.then(() => { throw new Error(`命令执行超时（${timeout/1000}秒）`); })
      ]) as { stdout: string; stderr: string };
      
      clearInterval(progressTimer); // 清除进度报告定时器
      
      console.log('结束时间:', new Date().toLocaleTimeString());
      
      if (result.stdout) {
        console.log(result.stdout);
      }
      
      if (result.stderr) {
        console.error(result.stderr);
      }
    } catch (error) {
      clearInterval(progressTimer); // 出错时也要清除定时器
      throw error;
    }
  } catch (error) {
    console.error(`执行命令失败: ${command}`);
    console.error(error);
    
    // 如果是超时错误，提供更多排查建议
    if (error.message && error.message.includes('超时')) {
      console.log('\n可能的原因:');
      console.log('1. 数据库连接太慢或网络不稳定');
      console.log('2. 数据库操作需要更长时间');
      console.log('3. 防火墙或代理可能阻止了连接');
      console.log('\n建议:');
      console.log('- 检查数据库连接是否正常');
      console.log('- 尝试直接使用psql或其他工具连接数据库');
      console.log('- 可能需要提高数据库连接池设置');
      console.log('- 如果在云环境，检查网络策略和超时设置');
    }
    
    process.exit(1);
  }
}

// 可用的迁移命令 - 去掉所有可能导致问题的选项
const commands = {
  // 生成迁移文件
  generate: 'npx drizzle-kit generate --config=drizzle.config.prod.ts',
  
  // 推送迁移到数据库
  push: 'npx drizzle-kit push --config=drizzle.config.prod.ts',
  
  // 从数据库拉取模式
  pull: 'npx drizzle-kit pull --config=drizzle.config.prod.ts',
  
  // 检查迁移文件与数据库的差异
  check: 'npx drizzle-kit check --config=drizzle.config.prod.ts',
  
  // 工作室（不推荐在生产环境使用）
  studio: 'npx drizzle-kit studio --config=drizzle.config.prod.ts',
};

/**
 * 获取数据库URL，用于显示
 */
function getDatabaseUrlForDisplay(): string {
  // 首先检查VITE_DATABASE_URL
  if (process.env.VITE_DATABASE_URL) {
    // 不显示完整URL，保护敏感信息
    return process.env.VITE_DATABASE_URL.replace(/\/\/(.+?):.+?@/g, '//$1:***@');
  }
  
  if (process.env.PROD_DATABASE_URL) {
    return process.env.PROD_DATABASE_URL.replace(/\/\/(.+?):.+?@/g, '//$1:***@');
  }
  
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace(/\/\/(.+?):.+?@/g, '//$1:***@');
  }
  
  return '未设置';
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || '';
  const commandKey = command.toLowerCase();
  
  if (!commandKey) {
    console.log('请提供命令: generate, push, pull, check');
    console.log('例如: npm run db:prod:push');
    process.exit(1);
  }
  
  if (!Object.prototype.hasOwnProperty.call(commands, commandKey)) {
    console.error(`未知命令: ${commandKey}`);
    console.log('可用命令: generate, push, pull, check');
    process.exit(1);
  }

  console.log('⚠️ 警告: 您正在操作生产环境数据库!');
  
  // 检查环境变量
  console.log('\n环境变量检查:');
  console.log(`VITE_DATABASE_URL: ${process.env.VITE_DATABASE_URL ? '✓ 已设置' : '✗ 未设置'}`);
  console.log(`PROD_DATABASE_URL: ${process.env.PROD_DATABASE_URL ? '✓ 已设置' : '✗ 未设置'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✓ 已设置' : '✗ 未设置'}`);
  
  console.log('\n将使用数据库URL:', getDatabaseUrlForDisplay());
  
  if (commandKey === 'push') {
    console.log('\n⚠️ 警告: 您将直接修改生产环境数据库!');
    console.log('建议先运行 db:prod:check 检查变更情况');
    console.log('\n将在5秒后继续，按 Ctrl+C 取消...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  } else {
    // 给用户3秒钟时间决定是否中止操作
    console.log('\n将在3秒后继续，按 Ctrl+C 取消...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // 执行命令
  console.log(`\n开始执行 ${commandKey} 命令...`);
  await runDrizzleCommand(commands[commandKey]);
  console.log(`\n${commandKey} 命令执行完成！`);
}

// 执行主函数
main().catch(err => {
  console.error('执行失败:');
  console.error(err);
  process.exit(1);
}); 