import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// MySQL连接配置
const poolOptions = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'honostudy',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 用户信息
const newUser = {
    username: 'admin4',
    password: '123456',
    email: 'admin4@example.com'
};

async function addUser() {
    // 创建连接池
    const pool = mysql.createPool(poolOptions);

    // 获取连接
    const connection = await pool.getConnection();
    try {
        console.log(`正在添加新用户 ${newUser.username}...`);

        // 检查用户是否已存在
        const [existingUsers] = await connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE username = ?',
            [newUser.username]
        );

        if (existingUsers[0].count > 0) {
            console.log(`用户 ${newUser.username} 已存在，跳过创建`);
        } else {
            // 使用bcrypt加密密码
            const hashedPassword = await bcrypt.hash(newUser.password, 10);

            // 插入新用户
            await connection.execute(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                [newUser.username, hashedPassword, newUser.email]
            );
            console.log(`用户 ${newUser.username} 已成功创建，密码：${newUser.password}`);
            console.log(`加密后的密码：${hashedPassword}`);
        }

    } catch (error) {
        console.error('添加用户失败:', error);
        throw error;
    } finally {
        connection.release();
        // 关闭连接池
        await pool.end();
    }
}

// 执行函数
addUser()
    .then(() => {
        console.log('添加用户操作完成');
        process.exit(0);
    })
    .catch((error) => {
        console.error('操作失败:', error);
        process.exit(1);
    }); 