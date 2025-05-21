# 数据库迁移指南

这个项目使用 Drizzle ORM 管理数据库。以下是如何执行数据库相关操作的指南。

## 创建与修改数据库模式

所有数据库表和关系都在 `src/db/schema.ts` 文件中定义。要修改数据库模式，需要编辑这个文件。

例如，要添加一个新表或修改现有表：

```typescript
// 添加新表
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  created_at: timestamp('created_at').defaultNow()
});

// 修改现有表 (例如添加一个新列)
// 在 users 表定义中添加 phone 列
export const users = pgTable('users', {
  /* 现有列... */
  phone: varchar('phone', { length: 20 })
});
```

## 数据库命令

我们提供了以下 Shell 脚本来执行数据库操作：

### 检查数据库变更

在应用更改前，先检查模式变更与数据库的差异：

```bash
./run-check.sh
```

### 生成迁移文件

修改 `schema.ts` 后，生成迁移文件：

```bash
./run-generate.sh
```

迁移文件将生成在 `migrations-prod` 目录中。

### 推送更改到数据库

将模式更改推送到数据库：

```bash
./run-push.sh
```

这会直接修改数据库结构。

### 从数据库拉取模式

如果需要基于现有数据库更新模式定义：

```bash
./run-pull.sh
```

## 迁移流程最佳实践

1. 先在 `schema.ts` 中修改数据库模式
2. 运行 `./run-check.sh` 检查更改
3. 运行 `./run-generate.sh` 生成迁移文件
4. 检查生成的 SQL 迁移文件是否符合预期
5. 运行 `./run-push.sh` 应用更改到数据库

## 在代码中使用数据库

在代码中导入数据库连接和模型：

```typescript
import { db, users, accounts } from '../config/database';
import { eq } from 'drizzle-orm';

// 查询示例
const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.email, 'example@example.com')).limit(1);

// 插入示例
await db.insert(users).values({
  username: 'newuser',
  password: 'hashedPassword', 
  email: 'new@example.com'
});

// 更新示例
await db.update(users)
  .set({ username: 'updatedname' })
  .where(eq(users.id, 1));

// 删除示例
await db.delete(users).where(eq(users.id, 1));
```

## 环境配置注意事项

确保 `.env.production` 文件中的环境变量格式正确，不要在变量名和等号之间添加空格：

```
# 正确格式
VITE_DATABASE_URL=postgresql://username:password@hostname:port/dbname

# 错误格式 (不要这样写)
VITE_DATABASE_URL = postgresql://username:password@hostname:port/dbname
``` 