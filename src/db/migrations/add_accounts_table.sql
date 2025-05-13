-- 创建accounts表
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  auth0_sub VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  nickname VARCHAR(100),
  email VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  picture VARCHAR(1000),
  device_number VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_accounts_auth0_sub ON accounts(auth0_sub);
CREATE INDEX IF NOT EXISTS idx_accounts_device_number ON accounts(device_number);

-- 添加comments
COMMENT ON TABLE accounts IS 'Auth0账户信息表';
COMMENT ON COLUMN accounts.auth0_sub IS 'Auth0用户唯一标识符';
COMMENT ON COLUMN accounts.device_number IS '设备号'; 