-- 迁移脚本：将登录类型从accounts表移动到devices表，清理冗余字段

-- 1. 向devices表添加login_type字段
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS login_type INTEGER DEFAULT 1;

-- 添加字段注释
COMMENT ON COLUMN devices.login_type IS '登录类型：1=Apple登录，2=Google登录';

-- 2. 数据迁移：将accounts表中的login_type数据迁移到devices表对应的记录
-- 通过device_accounts关联表找到对应的设备记录
UPDATE devices d
SET login_type = a.login_type
FROM accounts a
JOIN device_accounts da ON a.id = da.account_id
WHERE d.id = da.device_id
AND a.login_type IS NOT NULL;

-- 3. 从accounts表中删除login_type字段
ALTER TABLE accounts 
DROP COLUMN IF EXISTS login_type;

-- 4. 从accounts表中删除不再需要的device_number字段
ALTER TABLE accounts 
DROP COLUMN IF EXISTS device_number;

-- 创建日志记录
DO $$
BEGIN
    RAISE NOTICE '数据库结构更新完成：将login_type从accounts表移至devices表，并删除冗余字段';
END $$; 