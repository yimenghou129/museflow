'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Task = {
  id: string;
  title: string;
  status: string;
  is_today: boolean;
};

export function TodayTop3ManualSelect({
  initialTasks,
}: {
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTasks = useMemo(
    () => tasks.filter((t) => t.is_today),
    [tasks]
  );
  const selectedCount = selectedTasks.length;
  const top3 = selectedTasks.slice(0, 3);

  async function refreshTasks() {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('tasks')
      .select('id, title, status, is_today')
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (err) throw err;
    setTasks(Array.isArray(data) ? (data as Task[]) : []);
  }

  async function setIsToday(taskId: string, next: boolean) {
    setError(null);
    setLimitMsg(null);
    setBusyId(taskId);

    try {
      if (next) {
        const alreadySelected = tasks.find((t) => t.id === taskId)?.is_today;
        if (!alreadySelected && selectedCount >= 3) {
          setLimitMsg('Top3 已满：请先取消一个任务再选择。');
          return;
        }
      }

      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ is_today: next })
        .eq('id', taskId);

      if (updateError) throw updateError;
      await refreshTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {/* Top3 区域 */}
      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-900">Top3</h2>
        {top3.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            还没有选择 Top3。下面的任务列表里可以勾选最多 3 个。
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

      {/* Task List 区域 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-900">Task List（选择 Top3）</h2>
        <p className="mt-1 text-xs text-zinc-500">
          已选择：{selectedCount}/3
        </p>

        {limitMsg && (
          <p className="mt-3 text-sm text-amber-700" role="alert">
            {limitMsg}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        {tasks.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            你当前没有未完成 tasks。
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {tasks.map((t) => {
              const checked = t.is_today;
              const disabled = !checked && selectedCount >= 3;
              return (
                <li
                  key={t.id}
                  className={[
                    'flex items-center justify-between gap-4 rounded-lg border px-3 py-2',
                    checked
                      ? 'border-emerald-400/60 bg-emerald-900/10'
                      : 'border-zinc-200 bg-zinc-50',
                  ].join(' ')}
                >
                  <label className="flex min-w-0 flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled || busyId === t.id}
                      onChange={(e) => setIsToday(t.id, e.target.checked)}
                    />
                    <span className="min-w-0 truncate text-zinc-900">
                      {t.title}
                    </span>
                  </label>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-zinc-500">
                    {t.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

