import mysql from 'mysql2/promise';

// MySQL连接配置
const poolOptions = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function createDatabase() {
    // 创建连接池
    const pool = mysql.createPool(poolOptions);

    // 获取连接
    const connection = await pool.getConnection();
    try {
        console.log('正在检查数据库是否存在...');

        // 尝试创建数据库（如果不存在）
        await connection.query('CREATE DATABASE IF NOT EXISTS honostudy');

        console.log('数据库 honostudy 已确保存在');

        // 切换到该数据库
        await connection.query('USE honostudy');

        console.log('已切换到 honostudy 数据库');

        // 创建表
        console.log('正在创建表...');

        // 创建tasks表
        await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description VARCHAR(1000),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // 创建users表
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        console.log('表已创建');

        // 插入示例数据
        console.log('正在插入示例数据...');

        // 检查tasks表是否为空
        const [tasksCount] = await connection.query('SELECT COUNT(*) as count FROM tasks');
        if (tasksCount[0].count === 0) {
            await connection.query(`
        INSERT INTO tasks (title, description, status) VALUES 
        ('完成Hono项目', '实现一个基于Hono的RESTful API', 'pending'),
        ('学习Drizzle ORM', '了解如何使用Drizzle ORM与MySQL交互', 'in-progress'),
        ('部署应用', '将应用部署到Cloudflare Workers', 'todo')
      `);
            console.log('示例任务数据已插入');
        } else {
            console.log('tasks表已有数据，跳过示例数据插入');
        }

        // 检查users表是否为空
        const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        if (usersCount[0].count === 0) {
            await connection.query(`
        INSERT INTO users (username, password, email) VALUES 
        ('admin', '$2b$10$rRBXBGJDZMQqCXyy1tdvyuC0aJZkJJ5jPvPxFGD10cvkJl6J1Opqi', 'admin@example.com')
      `);
            console.log('示例用户数据已插入（密码: 123456）');
        } else {
            console.log('users表已有数据，跳过示例数据插入');
        }

        console.log('数据库初始化完成！');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    } finally {
        connection.release();
        // 关闭连接池
        await pool.end();
    }
}

async function main() {
    try {
        await createDatabase();
        process.exit(0);
    } catch (error) {
        console.error('迁移失败:', error);
        process.exit(1);
    }
}

main(); 