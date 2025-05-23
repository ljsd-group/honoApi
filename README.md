# bos-api-server

基于Cloudflare Workers和Hono框架构建的API服务。

## 功能特点

- 使用Hono框架构建的轻量级API
- 适用于Cloudflare Workers环境
- 集成Drizzle ORM进行数据库操作
- 支持Auth0认证
- 包含代理API功能
- 标准化的API响应格式

## 项目结构

```
bos-api-server/
├── src/
│   ├── config/         # 配置文件
│   ├── db/             # 数据库相关
│   ├── endpoints/      # API端点实现
│   ├── middlewares/    # 中间件
│   ├── routes/         # 路由定义
│   ├── services/       # 业务服务
│   ├── types/          # 类型定义
│   └── utils/          # 工具函数
├── drizzle/            # 数据库迁移文件
└── wrangler.toml       # Cloudflare Workers配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 部署到Cloudflare Workers

```bash
npm run deploy
```

### 数据库操作

生成迁移文件:
```bash
npm run db:generate
```

应用迁移到数据库:
```bash
npm run db:push
```

运行数据库管理界面:
```bash
npm run db:studio
```

## API路由

- `/api/auth/login` - 用户登录
- `/api/auth/auth0` - Auth0登录
- `/api/auth/callback` - Auth0回调
- `/api/auth/verify` - 验证令牌
- `/api/proxy/find-subscribe` - 订阅查询
- `/api/proxy/logoff` - 退出登录
- `/api/proxy/common` - 通用代理
