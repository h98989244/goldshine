-- Migration: create_returns_table
-- Created at: 1767630205

-- 創建退貨表
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    return_reason TEXT NOT NULL,
    return_amount DECIMAL(15,2) NOT NULL,
    return_status VARCHAR(30) DEFAULT 'pending',
    refund_method VARCHAR(50) DEFAULT 'original_payment',
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 為退貨表添加註釋
COMMENT ON TABLE returns IS '退貨記錄表';
COMMENT ON COLUMN returns.return_status IS '退貨狀態：pending(待處理)、approved(已核准)、rejected(已拒絕)、completed(已完成退款)';
COMMENT ON COLUMN returns.refund_method IS '退款方式：original_payment(原路退款)、cash(現金)、store_credit(門市抵用券)';
COMMENT ON COLUMN returns.return_reason IS '退貨原因';

-- 創建退貨表的RLS策略
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- 允許管理員查看所有退貨記錄
DROP POLICY IF EXISTS "Allow admin access to all returns" ON returns;
CREATE POLICY "Allow admin access to all returns" ON returns
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM profiles WHERE role = 'admin'
    ));

-- 允許代理商查看與其相關的退貨記錄
DROP POLICY IF EXISTS "Allow agent access to related returns" ON returns;
CREATE POLICY "Allow agent access to related returns" ON returns
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM orders o
            LEFT JOIN agents a ON o.agent_id = a.id
            WHERE a.auth_user_id = auth.uid()
        )
    );;