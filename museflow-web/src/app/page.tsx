import Link from "next/link";

const flows = [
  {
    id: "brain-dump",
    href: "/brain-dump",
    label: "Step 1 · Brain Dump",
    title: "把脑内一切倒出来",
    description:
      "自由输入所有待办、想法和项目，MuseFlow 会先帮你整理成结构化草案。",
    badge: "PRD · 6.1",
  },
  {
    id: "draft",
    href: "/brain-dump",
    label: "Step 2 · Draft & Plan",
    title: "协作编辑与排期草案",
    description:
      "基于 AI 草案协作编辑分类、时长与优先级，为容量感排期做好准备。",
    badge: "PRD · 6.2 · 6.4",
  },
  {
    id: "today",
    href: "/today",
    label: "Step 3 · Today 执行",
    title: "专注今日 Top 3",
    description:
      "系统生成今日 Top 3 与剩余容量，用最小的界面陪你完成当下。",
    badge: "PRD · 6.7",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10">
        <header className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/40 px-3 py-1 text-xs font-medium text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            MuseFlow · MVP 1.0 · Execution Engine
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              把混乱的脑内输入，变成可完成的计划。
            </h1>
            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              MuseFlow 不是待办清单，也不是笔记工具。
              它是一个协作式执行系统：把混乱转为结构，把结构转为计划，把计划转为可见成果。
            </p>
          </div>
        </header>

        <main className="grid flex-1 gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1.4fr)]">
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              核心执行流程
            </h2>
            <div className="grid gap-4">
              {flows.map((flow) => (
                <Link
                  key={flow.id}
                  href={flow.href}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition hover:border-zinc-500/80 hover:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                        {flow.label}
                      </p>
                      <h3 className="text-base font-semibold text-zinc-50 sm:text-lg">
                        {flow.title}
                      </h3>
                      <p className="text-xs text-zinc-400 sm:text-sm">
                        {flow.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-zinc-700/80 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300">
                      {flow.badge}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      进入这个步骤 →
                    </span>
                    <span className="text-zinc-600">
                      点击卡片开始 · 支持后续动态重排
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <aside className="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              你的执行引擎
            </h2>
            <div className="space-y-3 text-sm text-zinc-300">
              <p>
                MuseFlow 按「容量感」来帮你排期，而不是帮你堆砌理想清单。
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li>· 记录 daily capacity 与偏好工作时段</li>
                <li>· 控制每日深度任务数量，避免过载</li>
                <li>· 当执行崩盘时，自动进入 Crisis Mode 重新启动</li>
              </ul>
              <div className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Persona 模式（MVP）
                </p>
                <p className="text-xs text-zinc-300">
                  先从 Gentle（温柔知性）开始，后续你可以在设置中切换为
                  Executive（更强执行推进）。
                </p>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-4 border-t border-zinc-900 pt-4 text-xs text-zinc-500">
          建议从 <span className="font-medium text-zinc-300">Brain Dump</span>{" "}
          开始，一次性把脑中的一切导入 MuseFlow。
        </footer>
      </div>
    </div>
  );
}
