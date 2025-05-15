-- 创建设备表
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  device_number VARCHAR(255) NOT NULL UNIQUE,
  phone_model VARCHAR(100),
  country_code VARCHAR(10),
  version VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建设备账户关联表
CREATE TABLE IF NOT EXISTS device_accounts (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, device_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_devices_device_number ON devices(device_number);
CREATE INDEX IF NOT EXISTS idx_device_accounts_account_id ON device_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_device_id ON device_accounts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_is_active ON device_accounts(is_active);

-- 添加注释
COMMENT ON TABLE devices IS '设备信息表';
COMMENT ON COLUMN devices.device_number IS '设备唯一标识号';
COMMENT ON COLUMN devices.phone_model IS '设备型号';
COMMENT ON COLUMN devices.country_code IS '国家代码';
COMMENT ON COLUMN devices.version IS '应用版本';

COMMENT ON TABLE device_accounts IS '设备和账户关联表';
COMMENT ON COLUMN device_accounts.account_id IS '关联的账户ID';
COMMENT ON COLUMN device_accounts.device_id IS '关联的设备ID';
COMMENT ON COLUMN device_accounts.is_active IS '是否为活跃关联';
COMMENT ON COLUMN device_accounts.last_login IS '最后登录时间';

-- 将现有accounts表中的设备号数据迁移到新表结构
-- 1. 插入唯一设备
INSERT INTO devices (device_number)
SELECT DISTINCT device_number FROM accounts
WHERE device_number IS NOT NULL AND device_number != '';

-- 2. 创建账户和设备的关联
INSERT INTO device_accounts (account_id, device_id)
SELECT a.id, d.id
FROM accounts a
JOIN devices d ON a.device_number = d.device_number
WHERE a.device_number IS NOT NULL AND a.device_number != '';

-- 注意：以下注释的SQL是用来从accounts表中移除device_number字段的
-- 我们保留此字段以保证向后兼容，但它不再是主要存储位置
-- ALTER TABLE accounts DROP COLUMN IF EXISTS device_number; 