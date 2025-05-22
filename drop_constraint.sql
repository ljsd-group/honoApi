-- 删除accounts表中auth0_sub字段的唯一约束
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_auth0_sub_unique";

-- 确认约束已删除
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'accounts' 
  AND constraint_name = 'accounts_auth0_sub_unique'; 