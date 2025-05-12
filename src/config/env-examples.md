# 环境变量配置示例

在项目根目录中，您应该创建以下环境变量文件：

## 1. `.env` - 基础环境变量文件

所有环境都会加载这些变量。

```
# 基础环境变量文件
# 所有环境都会加载这些变量

# API 配置
API_BASE_PATH=/api

# 日志配置
LOG_LEVEL=debug

# Auth0 配置
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_REDIRECT_URI=http://localhost:3000/api/auth/callback

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_ALGORITHM=HS256
```

## 2. `.env.development` - 开发环境特定变量

```
# 开发环境特定变量

# 环境名称
NODE_ENV=development

# 服务器配置
PORT=3000
HOST=0.0.0.0

# 前端应用 URL
FRONTEND_URL=http://192.168.31.177:8080

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:3000,http://192.168.31.177:8080
```

## 3. `.env.production` - 生产环境特定变量

```
# 生产环境特定变量

# 环境名称
NODE_ENV=production

# 服务器配置
PORT=8080
HOST=0.0.0.0

# 前端应用 URL
FRONTEND_URL=https://your-production-domain.com

# CORS 配置
CORS_ORIGINS=https://your-production-domain.com,https://api.your-production-domain.com

# 日志配置
LOG_LEVEL=info
```

## 4. `.env.test` - 测试环境特定变量

```
# 测试环境特定变量

# 环境名称
NODE_ENV=test

# 服务器配置
PORT=3000
HOST=0.0.0.0

# 前端应用 URL
FRONTEND_URL=http://test-domain.com

# CORS 配置
CORS_ORIGINS=*

# 测试数据库配置
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=test_db
TEST_DB_USER=test_user
TEST_DB_PASSWORD=test_password
```

## 使用说明

1. 在项目根目录创建上述文件
2. 根据您的实际配置修改这些文件中的值
3. 确保将这些文件添加到 `.gitignore` 中，避免将敏感信息提交到代码库
4. 仅将 `.env.example` 文件（不含敏感信息的示例）添加到版本控制中 