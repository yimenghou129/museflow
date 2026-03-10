import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type Task = {
  id: string;
  title: string;
  status: string;
};

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/today');
  }

  const { data: tasksRaw, error } = await supabase
    .from('tasks')
    .select('id, title, status')
    .neq('status', 'done')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  const tasks: Task[] = Array.isArray(tasksRaw) ? tasksRaw : [];
  const top3 = tasks.slice(0, 3);
  const otherTasks = tasks.slice(3);

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← MuseFlow
          </Link>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <h1 className="text-2xl font-semibold text-zinc-900">Today</h1>
            <p className="text-sm text-zinc-500">{todayStr}</p>
          </div>
          <p className="mt-1 text-zinc-600">
            今日 Top 3 · 剩余容量 · 快捷操作（完成 / 延期 / 我卡住了）
          </p>
        </header>

        {/* Top3 区域 */}
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">今日 Top 3</h2>
          {error && (
            <p className="mt-2 text-xs text-red-500" role="alert">
              加载任务出错：{error.message}
            </p>
          )}
          {top3.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              暂无 Top 3。稍后我们会根据排期和优先级自动推荐今日任务。
            </p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {top3.map((t, idx) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                      {idx + 1}
                    </span>
                    <span className="text-zinc-900">{t.title}</span>
                  </span>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {t.status}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Other Tasks 区域 */}
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Other Tasks</h2>
          {otherTasks.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              除 Top 3 外，没有更多未完成任务啦。
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {otherTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                >
                  <span className="text-zinc-900">{t.title}</span>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {t.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
