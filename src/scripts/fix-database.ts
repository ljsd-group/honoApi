#!/usr/bin/env node

import { runMigration } from '../db/migrate';
import fs from 'fs';
import path from 'path';
import process from 'process';

/**
 * 从wrangler.toml文件中读取数据库URL
 */
function getDatabaseUrlFromWrangler(): string | null {
  try {
    // 读取wrangler.toml文件
    const wranglerPath = path.resolve(process.cwd(), 'wrangler.toml');
    
    if (!fs.existsSync(wranglerPath)) {
      console.error('找不到wrangler.toml文件');
      return null;
    }
    
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    
    // 使用正则表达式匹配数据库URL
    const databaseUrlMatch = wranglerContent.match(/DATABASE_URL\s*=\s*"([^"]+)"/);
    
    if (databaseUrlMatch && databaseUrlMatch[1]) {
      return databaseUrlMatch[1];
    }
    
    console.error('在wrangler.toml中找不到DATABASE_URL');
    return null;
  } catch (error) {
    console.error('读取wrangler.toml文件失败:', error);
    return null;
  }
}

async function main() {
  console.log('开始修复数据库...');
  
  // 尝试从wrangler.toml获取数据库URL，否则使用环境变量
  const databaseUrl = getDatabaseUrlFromWrangler() || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('错误: 未找到数据库URL。请在wrangler.toml中设置DATABASE_URL或设置环境变量。');
    process.exit(1);
  }
  
  console.log('使用数据库URL:', databaseUrl.replace(/(.{5}).*:.*@/, '$1***:***@'));
  
  try {
    // 运行迁移以修复数据库问题
    await runMigration(databaseUrl);
    console.log('数据库修复完成！');
  } catch (error) {
    console.error('数据库修复失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main().catch(console.error); 