-- Migration: fix_orders_cascade_delete
-- Purpose: 修復刪除訂單時的 Foreign Key 衝突，確保 returns 和 commissions 表能隨訂單刪除

-- 1. 修改 returns 表的外鍵約束 (returns_order_id_fkey)
DO $$
BEGIN
  -- 移除可能存在的舊約束
  ALTER TABLE IF EXISTS returns DROP CONSTRAINT IF EXISTS returns_order_id_fkey;
  
  -- 新增帶有 ON DELETE CASCADE 的約束
  ALTER TABLE returns
  ADD CONSTRAINT returns_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES orders(id)
  ON DELETE CASCADE;
END $$;

-- 2. 修改 commissions 表的外鍵約束 (通常是 commissions_order_id_fkey)
-- 雖然使用者目前只遇到 returns 的問題，但 commissions 也引用了 orders，預防萬一也一併處理
DO $$
BEGIN
  -- 先檢查 commissions 表是否存在，以及約束名稱
  -- 嘗試標準命名 commissions_order_id_fkey
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
      ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_order_id_fkey;

      ALTER TABLE commissions
      ADD CONSTRAINT commissions_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE;
  END IF;
END $$;
