import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TodayDate } from '@/components/TodayDate';
import { TodayTop3ManualSelect } from '@/components/TodayTop3ManualSelect';

type Task = {
  id: string;
  title: string;
  status: string;
  is_today: boolean;
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
    .select('id, title, status, is_today')
    .neq('status', 'done')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  const tasks: Task[] = Array.isArray(tasksRaw) ? tasksRaw : [];

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
            <TodayDate />
          </div>
          <p className="mt-1 text-zinc-600">
            今日 Top 3 · 剩余容量 · 快捷操作（完成 / 延期 / 我卡住了）
          </p>
        </header>

        {/* Top3（手动选择）+ Task List */}
        {error ? (
          <p className="text-sm text-red-500" role="alert">
            加载任务出错：{error.message}
          </p>
        ) : (
          <TodayTop3ManualSelect initialTasks={tasks} />
        )}
      </div>
    </div>
  );
}
