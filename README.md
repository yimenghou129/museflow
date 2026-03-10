# MuseFlow

协作式执行系统：把混乱的脑内输入转化为结构化、基于真实容量的可执行计划。

- **产品需求**：[PRD.md](./PRD.md)
- **Web 应用**：[museflow_web](./museflow_web/)（Next.js + Supabase + OpenAI）

## 环境与搭建（Env / Setup）

本地运行、环境变量、数据库等步骤见 ** [museflow_web/README.md](./museflow_web/README.md)** 中的「环境与本地搭建（Env / Setup）」一节。

简要步骤：

1. `cd museflow_web && pnpm install`
2. 在 `museflow_web` 下创建 `.env.local`，配置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`OPENAI_API_KEY`
3. 在 Supabase 中执行 `supabase/migrations/` 下的 SQL
4. `pnpm dev`，访问 http://localhost:3000
