import bcrypt from 'bcryptjs';
import { SafeUser, UserWithPassword } from '../types/auth';

/**
 * 模拟数据库中的用户
 * 实际应用中应该连接到数据库
 */
const MOCK_USERS: UserWithPassword[] = [
  {
    id: '1',
    username: 'admin',
    // 密码: admin123
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    name: '管理员',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'user',
    // 密码: user123
    password: '$2a$10$CwTycUXWue0Thq9StjUM0uQxTmxRuOXA/R3allOM78a0iPnndaiyi',
    name: '普通用户',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// 定义开发环境账号密码映射
const DEV_ACCOUNTS = {
  'admin': 'admin123',
  'user': 'user123'
};

/**
 * 验证用户凭证
 * @param username 用户名
 * @param password 密码
 * @returns 验证通过返回用户信息（不含密码），否则返回null
 */
export async function validateUser(username: string, password: string): Promise<SafeUser | null> {
  console.log(`尝试验证用户: ${username}`);
  
  // 查找用户
  const user = MOCK_USERS.find(u => u.username === username);
  
  if (!user) {
    console.log(`用户不存在: ${username}`);
    return null;
  }
  
  console.log(`找到用户: ${username}, 现在比较密码`);
  
  // 开发环境直接验证
  if (DEV_ACCOUNTS[username] === password) {
    console.log('开发环境账号密码验证成功');
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  try {
    // 生产环境使用bcrypt验证
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`密码验证结果: ${isPasswordValid ? '成功' : '失败'}`);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // 返回用户信息，排除密码
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (err) {
    console.error('密码验证出错:', err);
    return null;
  }
}

/**
 * 根据ID查找用户
 * @param id 用户ID
 * @returns 用户信息（不含密码）或null
 */
export function findUserById(id: string): SafeUser | null {
  const user = MOCK_USERS.find(u => u.id === id);
  
  if (!user) {
    return null;
  }
  
  // 返回用户信息，排除密码
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * 哈希密码
 * @param password 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
} 