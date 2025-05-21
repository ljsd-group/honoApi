# 数据库迁移指南

本项目使用 Drizzle ORM 管理数据库模式和迁移。下面是如何使用这些功能的说明。

## 配置文件

数据库配置在以下文件中：

- `src/config/database.ts` - 数据库连接配置
- `src/db/schema.ts` - 数据库模式定义
- `drizzle.config.ts` - Drizzle 工具配置（开发环境）
- `drizzle.config.prod.ts` - Drizzle 工具配置（生产环境）

## 环境变量

数据库连接支持多种配置方式，系统会按以下顺序查找连接信息：

1. 使用 `DATABASE_URL` 环境变量（Node.js 环境）
2. 使用 `VITE_DATABASE_URL` 环境变量（Vite/浏览器环境或Node环境）
3. 使用分开的配置参数（在 `src/config/env.ts` 中定义）

### 设置环境变量

创建一个 `.env` 文件在项目根目录，包含以下内容：

```
# 数据库连接字符串
DATABASE_URL=postgres://username:password@hostname:port/database
```

或者使用 Vite 环境变量（将自动在客户端可用）：

```
VITE_DATABASE_URL=postgres://username:password@hostname:port/database
```

如果没有设置上述环境变量，系统将使用 `src/config/env.ts` 中的参数自动构建连接字符串：

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_PASSWORD=password
DB_NAME=database
```

## 数据库迁移命令

### 开发环境

以下命令用于开发环境的数据库迁移：

#### 生成迁移文件

当你修改了 `src/db/schema.ts` 后，可以生成迁移文件：

```bash
npm run generate
# 或
npm run db:generate
```

这将在 `migrations` 目录中创建 SQL 迁移文件，例如 `migrations/0000_deep_nocturne.sql`。

#### 应用迁移

要将模式变更应用到数据库：

```bash
npm run migrate
# 或
npm run db:push
```

此命令会直接将模式变更推送到数据库。

#### 查看模式差异

要查看当前模式与数据库之间的差异：

```bash
npm run db:check
```

#### 从数据库拉取模式

如果数据库已有结构，可以从数据库生成模式：

```bash
npm run db:pull
```

#### 使用 Drizzle Studio

启动 Drizzle Studio 可视化界面来管理数据库：

```bash
npm run db:studio
```

### 生产环境

对于生产环境，我们提供了单独的命令和配置，以确保安全性和可控性：

#### 配置生产环境数据库

1. 复制 `.env.production.example` 为 `.env.production`
2. 在 `.env.production` 中设置生产环境数据库连接信息：
   ```
   PROD_DATABASE_URL=postgres://username:password@production-host:5432/prod_db
   ```

#### 生产环境迁移命令

生产环境迁移命令会先显示警告并有短暂延迟，给您时间确认操作：

```bash
# 生成生产环境迁移文件
npm run db:prod:generate

# 将迁移应用到生产数据库
npm run db:prod:push

# 检查生产数据库与模式的差异
npm run db:prod:check

# 从生产数据库拉取模式
npm run db:prod:pull
```

生产环境迁移文件将存储在 `migrations-prod` 目录中，与开发环境迁移分开管理。

#### 生产环境迁移最佳实践

1. 总是先在开发环境测试迁移
2. 在应用迁移前，先使用 `db:prod:check` 检查差异
3. 在应用迁移前，备份生产数据库
4. 考虑使用带版本控制的CI/CD流程进行数据库迁移
5. 对于重要的结构变更，考虑在低峰期进行迁移

## 迁移文件

生成的迁移文件位于 `migrations` 或 `migrations-prod` 目录中，每个文件包含创建表、修改表结构的 SQL 语句。例如：

```sql
CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "username" varchar(50) NOT NULL,
  "password" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "users_username_unique" UNIQUE("username"),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);
```

## 在代码中使用数据库

你可以在代码中使用 `db` 对象来操作数据库：

```typescript
import { db, users } from '../config/database';
import { eq } from 'drizzle-orm';

// 查询所有用户
const allUsers = await db.select().from(users);

// 按条件查询
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'test@example.com'))
  .limit(1);

// 插入数据
await db.insert(users)
  .values({
    username: 'newuser',
    password: 'hashedpassword',
    email: 'new@example.com'
  });

// 更新数据
await db.update(users)
  .set({ username: 'updateduser' })
  .where(eq(users.email, 'new@example.com'));

// 删除数据
await db.delete(users)
  .where(eq(users.email, 'new@example.com'));
```

## 事务

Drizzle 支持事务操作：

```typescript
await db.transaction(async (tx) => {
  const user = await tx.insert(users)
    .values({
      username: 'transaction_user',
      password: 'password',
      email: 'tx@example.com'
    })
    .returning();
  
  await tx.insert(accounts)
    .values({
      user_id: user[0].id,
      auth0_sub: 'auth0|123456',
      email: 'tx@example.com'
    });
});
```

## 关系查询

```typescript
const usersWithAccounts = await db.select({
  userId: users.id,
  username: users.username,
  email: users.email,
  accountId: accounts.id,
  auth0Sub: accounts.auth0_sub
})
  .from(users)
  .leftJoin(accounts, eq(users.id, accounts.user_id));
``` 