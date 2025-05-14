-- 向accounts表添加login_type字段
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS login_type INTEGER DEFAULT 1;

-- 添加字段注释
COMMENT ON COLUMN accounts.login_type IS '登录类型：1=Apple登录，2=Google登录'; 