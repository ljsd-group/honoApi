import path from 'path';
import * as dotenv from 'dotenv';
import fs from 'fs';

// 检查 .env.production 文件是否存在
const prodEnvPath = path.resolve(process.cwd(), '.env.production');
console.log('检查 .env.production 文件:', fs.existsSync(prodEnvPath) ? '存在' : '不存在');

// 加载环境变量
const result = dotenv.config({ path: prodEnvPath });
console.log('加载环境变量结果:', result.error ? '失败' : '成功');

// 检查环境变量
console.log('\n环境变量检查:');
console.log('PROD_DATABASE_URL:', process.env.PROD_DATABASE_URL ? '已设置' : '未设置');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
console.log('VITE_DATABASE_URL:', process.env.VITE_DATABASE_URL ? '已设置' : '未设置');

// 获取实际会使用的URL
function getActualDatabaseUrl(): string {
  if (process.env.PROD_DATABASE_URL) {
    return `PROD_DATABASE_URL: ${maskPassword(process.env.PROD_DATABASE_URL)}`;
  }
  
  if (process.env.DATABASE_URL) {
    return `DATABASE_URL: ${maskPassword(process.env.DATABASE_URL)}`;
  }
  
  if (process.env.VITE_DATABASE_URL) {
    return `VITE_DATABASE_URL: ${maskPassword(process.env.VITE_DATABASE_URL)}`;
  }
  
  return '没有可用的数据库URL';
}

// 掩盖密码部分，保护敏感信息
function maskPassword(url: string): string {
  if (!url) return '';
  return url.replace(/\/\/(.+?):.+?@/g, '//$1:****@');
}

console.log('\n实际将使用的数据库URL:');
console.log(getActualDatabaseUrl());

// 提示如何创建 .env.production 文件
if (result.error) {
  console.log('\n创建 .env.production 文件的指南:');
  console.log('1. 在项目根目录创建 .env.production 文件');
  console.log('2. 添加以下内容（替换为实际的生产环境数据库信息）:');
  console.log('   PROD_DATABASE_URL=postgres://username:password@production-host:5432/prod_db');
} 