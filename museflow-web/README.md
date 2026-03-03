## MuseFlow Web · MVP 1.0

协作式执行系统 MuseFlow 的 Web 前端（Next.js App Router + Supabase + OpenAI）。

完整产品需求文档见仓库根目录 `PRD.md`。

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

