## MuseFlow Web · MVP 1.0

协作式执行系统 MuseFlow 的 Web 前端（Next.js App Router + Supabase + OpenAI）。

完整产品需求文档见仓库根目录 `PRD.md`。

---

### 环境与本地搭建（Env / Setup）

1. **克隆并进入应用目录**
   ```bash
   git clone https://github.com/yimenghou129/museflow.git
   cd museflow/museflow_web
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   - 在本目录新建 `.env.local`（勿提交到 Git）。
   - 必填变量：
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
     OPENAI_API_KEY=sk-...
     ```
   - Supabase：控制台 → **Settings → API**，复制 Project URL 与 anon public key。
   - OpenAI：在 OpenAI 控制台创建 API Key。

4. **Supabase 数据库**
   - 在 Supabase 项目里执行 migrations：仓库根目录 `supabase/migrations/` 下的 `.sql` 按文件名顺序在 **SQL Editor** 中执行（或使用 Supabase CLI：`supabase db push`）。
   - 当前包含：`goals`、`tasks` 等表及 RLS policy；PRD 中的其他表（如 `BrainDump`、`DraftPlan`）若需使用也需在 Supabase 中建表。

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   - 浏览器打开 `http://localhost:3000`。

---

### 技术栈

- Next.js 16（App Router，Turbopack）
- React 19 + TypeScript 5
- TailwindCSS 4
- Supabase（Auth + Postgres + RLS）
- OpenAI API（Brain Dump 结构化 / 报告叙事）

---

### 环境变量（必填）

在本目录创建或编辑 `.env.local`（你已经有一份，可以直接修改）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
OPENAI_API_KEY=sk-...
```

对应 Supabase 控制台中的：

- Settings → Project Settings → API → Project URL
- Settings → Project Settings → API → anon public

---

### Supabase 数据结构

在 Supabase SQL Editor 中执行 `schema.sql`（或 README 中的建表 SQL），会创建：

- `UserPreference`
- `BrainDump`
- `DraftPlan`
- `Task`
- `ScheduleBlock`
- `Report`

所有表都启用了 RLS，仅允许用户访问自己的数据。

---

### 本地开发

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`：

- 首页：产品概览 + 执行流程（Brain Dump → Draft & Plan → Today）
- `/brain-dump`：Brain Dump 输入 + AI 结构化 + 保存草案
- `/today`：今日 Top 3 / 剩余容量（等待后续排期引擎接入）

