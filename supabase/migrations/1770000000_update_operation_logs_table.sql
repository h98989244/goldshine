-- 更新操作紀錄表結構
-- 添加操作前數值和操作後數值欄位

ALTER TABLE operation_logs 
DROP COLUMN IF EXISTS details,
ADD COLUMN IF NOT EXISTS old_values JSONB,
ADD COLUMN IF NOT EXISTS new_values JSONB,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 添加註釋
COMMENT ON COLUMN operation_logs.old_values IS '操作前的數值';
COMMENT ON COLUMN operation_logs.new_values IS '操作後的數值';
COMMENT ON COLUMN operation_logs.description IS '操作詳細說明';
COMMENT ON COLUMN operation_logs.action IS '操作類型，如：create_product, update_user, delete_agent 等';