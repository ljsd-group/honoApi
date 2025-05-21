#!/bin/bash

# 用于检查数据库变更
# 显示执行的每一步
set -x

# 从 .env.production 文件中手动读取和处理环境变量
if [ -f .env.production ]; then
  # 直接手动提取 VITE_DATABASE_URL 值，避免等号周围有空格的问题
  VITE_DATABASE_URL=$(grep VITE_DATABASE_URL .env.production | sed 's/VITE_DATABASE_URL[ ]*=[ ]*//')
  echo "已从 .env.production 读取数据库 URL"
else
  echo "未找到 .env.production 文件"
fi

# 直接设置 DATABASE_URL
if [ -n "$VITE_DATABASE_URL" ]; then
  export DATABASE_URL="$VITE_DATABASE_URL"
  echo "已设置 DATABASE_URL 为 VITE_DATABASE_URL 的值"
else
  echo "警告: 未找到 VITE_DATABASE_URL，尝试使用现有的 DATABASE_URL"
fi

# 打印数据库 URL（掩盖敏感信息）
if [ -n "$DATABASE_URL" ]; then
  MASKED_URL=$(echo "$DATABASE_URL" | sed 's/\/\/[^:]*:[^@]*@/\/\/***:***@/g')
  echo "数据库 URL: $MASKED_URL"
else
  echo "错误: 未设置 DATABASE_URL"
  exit 1
fi

# 直接执行 drizzle-kit check 命令检查数据库变更
echo "开始检查数据库变更..."
npx drizzle-kit check --config=drizzle.config.prod.ts

echo "数据库检查完成" 