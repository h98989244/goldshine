# CLAUDE.md

此檔案為 Claude Code (claude.ai/code) 在本專案中工作時的指引。

## 專案概述

黃金珠寶電商平台（TheVGold），具備 O2O（線上預約、線下取貨）系統、代理商/推薦佣金機制，以及 LINE LIFF 整合。支援雙語介面（繁體中文 / 越南文）與多幣別（TWD / VND）。

## 指令

```bash
pnpm dev              # 啟動開發伺服器（自動安裝依賴）
pnpm build            # 型別檢查 + 正式環境建置
pnpm build:prod       # 正式環境建置（BUILD_MODE=prod）
pnpm lint             # ESLint 檢查
pnpm preview          # 預覽正式環境建置
pnpm clean            # 清除 node_modules、lockfile，並清理 store
```

Supabase（需安裝 Supabase CLI）：
```bash
supabase start                          # 啟動本地 Supabase
supabase db push                        # 推送 migration 到遠端
supabase functions serve                # 本地執行 Edge Functions
supabase functions deploy <fn-name>     # 部署單一 Edge Function
```

## 技術棧

- **前端：** React 18 + TypeScript、Vite、Tailwind CSS、Radix UI、React Router 6
- **後端：** Supabase（PostgreSQL + PostgREST + Auth + Storage + Edge Functions）
- **Edge Functions：** Deno 執行環境（位於 `supabase/functions/`）
- **金流：** Stripe.js
- **LINE 整合：** LIFF SDK 用於登入與應用內瀏覽
- **部署：** AWS Amplify（推送至 main 分支自動部署）

## 架構

### 前端（`src/`）

**Context 全域狀態**（`src/contexts/`）— 在 `App.tsx` 中包裝：
- `AuthContext` — Supabase 驗證狀態、登入/註冊/登出
- `CartContext` — 購物車狀態、金價取得、幣別轉換
- `I18nContext` — 語言切換（zh-TW / vi）
- `ToastContext` — 透過 Sonner 顯示通知

**頁面**（`src/pages/`）— 路由元件定義於 `App.tsx`：
- 顧客端：HomePage、ProductsPage、CartPage、CheckoutPage、OrdersPage、ProfilePage、StoresPage
- 管理後台：AdminPage（`/admin/*`）含訂單、庫存、用戶、通知、設定等子分頁
- 代理商：AgentDashboardPage（`/agent/*`）含佣金、推薦、O2O 驗證
- POS：POSPage（`/pos`）

**服務層**（`src/services/adminApi.ts`）— 管理員 API 函式，封裝 Supabase 查詢、RPC 呼叫、分頁與操作日誌。

**Supabase 客戶端**位於 `src/lib/supabase.ts` — 共用的客戶端實例與型別定義。

### 後端（`supabase/`）

**Edge Functions**（`supabase/functions/`）— Deno 無伺服器處理程式：
- `line-login` — LINE OAuth 權杖交換與自動建立使用者
- `create-payment-intent` — 建立 Stripe 付款意圖
- `send-notification`、`order-notifications`、`batch-send-notifications` — 通知系統
- `create-agent`、`create-admin-user` — 帳號建立
- `reset-user-password`、`reset-agent-password` — 密碼管理
- `delete-user`、`get-users-data` — 用戶管理
- `upload-product-image` — 上傳圖片至 Supabase Storage

**Migrations**（`supabase/migrations/`）— 循序 SQL 檔案。核心資料表：`profiles`、`products`、`product_categories`、`stores`、`orders`、`order_items`、`gold_prices`、`agents`、`agent_referrals`、`commissions`、`notifications`、`operation_logs`、`coupons`、`roles`。所有資料表皆啟用列級安全性（RLS）。

### 驗證機制

三種驗證流程搭配角色權限（`profiles.role`）：
1. **顧客** — Supabase 信箱/密碼 或 LINE 登入（LIFF OAuth）
2. **管理員** — 信箱登入，驗證是否在 `ADMIN_EMAILS` 環境變數中，session 存於 localStorage
3. **代理商** — 獨立登入流程，位於 `/agent/login`

角色：`super_admin`、`product_editor`、`finance`、`customer_service`、`agent`、`pos_staff`

### 核心商業邏輯

- **動態定價：** 黃金重量 × 當日金價 + 工資，支援 TWD/VND 轉換
- **O2O 流程：** 顧客線上預約 → 選擇門市/時段 → 取得驗證碼 → 代理商於門市驗證
- **代理商佣金：** 依訂單追蹤，按月結算，綁定推薦碼
- **金價管理：** 儲存於 `gold_prices` 資料表，由管理員更新，CartContext 取得

## 環境變數

`.env.local`（及 AWS Amplify 主控台）中需設定：
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_LIFF_ID
VITE_GOOGLE_MAPS_API_KEY
VITE_STRIPE_PUBLISHABLE_KEY  （選用）
```

Edge Functions 另需在 Supabase secrets 中設定 `SUPABASE_SERVICE_ROLE_KEY`、`STRIPE_SECRET_KEY`、`ADMIN_EMAILS`。

## 慣例

- 套件管理器：**pnpm**（請勿使用 npm 或 yarn）
- 路徑別名：`@/` 對應至 `src/`（設定於 vite.config.ts 和 tsconfig）
- Tailwind 主題色：主色 `#2B5D3A`（綠色）、強調色 `#F5A623`（金色）
- 所有面向使用者的文字皆須透過 `I18nContext` 支援多語系
