'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: number | null;
  estimated_duration: number | null;
  status: string;
  is_today?: boolean | null;
};

function priorityScore(p: Task['priority'] | null): number {
  if (p == null) return 1;
  if (typeof p === 'number') {
    if (!Number.isFinite(p)) return 1;
    return p >= 3 ? 3 : p === 2 ? 2 : 1;
  }
  return 1;
}

function parseDateToUTCms(d: string | null): number {
  if (!d) return Number.POSITIVE_INFINITY;
  const parts = d.split('-').map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return Number.POSITIVE_INFINITY;
  }
  const [y, m, day] = parts;
  return Date.UTC(y, m - 1, day);
}

function parseDuration(d: number | null): number {
  return d != null && Number.isFinite(d) ? d : Number.POSITIVE_INFINITY;
}

export function TodayPageClient({
  initialTasks,
  autoRecommended,
}: {
  initialTasks: Task[];
  autoRecommended: boolean;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingTop3Id, setUpdatingTop3Id] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  // Top3 由数据库字段 is_today 决定，而不是由排序后的前 3 条决定
  const top3 = useMemo(() => {
    const picked = tasks.filter((t) => t.is_today === true);
    const ranked = [...picked].sort((a, b) => {
      const ap = priorityScore(a.priority);
      const bp = priorityScore(b.priority);
      if (bp !== ap) return bp - ap;

      const ad = parseDateToUTCms(a.due_date);
      const bd = parseDateToUTCms(b.due_date);
      if (ad !== bd) return ad - bd;

      const at = parseDuration(a.estimated_duration);
      const bt = parseDuration(b.estimated_duration);
      if (at !== bt) return at - bt;

      return 0;
    });
    return ranked.slice(0, 3);
  }, [tasks]);

  const selectedCount = useMemo(
    () => tasks.filter((t) => t.is_today === true).length,
    [tasks]
  );

  async function refreshTasks() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTasks([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority, status, is_today, estimated_duration')
        .eq('user_id', user.id)
        .neq('status', 'done')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setTasks(Array.isArray(data) ? (data as Task[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 tasks 失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask() {
    const title = newTitle.trim();
    if (!title) return;

    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('未登录');

      const { error: insertError } = await supabase.from('tasks').insert({
        user_id: user.id,
        title,
        status: 'todo',
        due_date: null,
        priority: null,
      });

      if (insertError) throw insertError;

      setNewTitle('');
      setShowAdd(false);
      await refreshTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建 task 失败');
    } finally {
      setSaving(false);
    }
  }

  async function setTaskIsToday(taskId: string, next: boolean) {
    setError(null);
    setUpdatingTop3Id(taskId);
    try {
      const supabase = createClient();

      if (next) {
        if (selectedCount >= 3) {
          setError('Top3 已满：请先取消一个任务再选择。');
          return;
        }

        const res = await fetch('/api/tasks/today-top3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? '设置 Top3 失败');
          return;
        }
      } else {
        // 取消选中一定允许：直接把 is_today=false
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ is_today: false })
          .eq('id', taskId);
        if (updateError) throw updateError;
      }

      await refreshTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败');
    } finally {
      setUpdatingTop3Id(null);
    }
  }

  async function rescheduleTask(taskId: string) {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/tasks/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '延期失败');
        return;
      }

      if (data.due_date) {
        setNotice(`已延后到 ${String(data.due_date).slice(0, 10)}`);
      } else {
        setNotice('已延期');
      }

      await refreshTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : '延期失败');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1️⃣ Top Section */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Today</h1>
        <h2 className="mt-1 text-sm font-medium text-zinc-600">Top 3</h2>

        {loading && (
          <p className="mt-3 text-sm text-zinc-500">加载中…</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-3 text-sm text-emerald-700" role="status">
            {notice}
          </p>
        )}

        {!loading && top3.length === 0 && (
          <p className="mt-3 text-sm text-zinc-500">
            暂无 Top 3 任务。你可以在下方添加一个 task。
          </p>
        )}

        {top3.length > 0 && (
          <ol className="mt-3 space-y-2 text-sm">
            {top3.map((t, idx) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                <span className="text-zinc-900">{t.title}</span>
                <div className="text-right">
                  {autoRecommended && (
                    <span className="mb-1 inline-block rounded-full border border-emerald-300/40 bg-emerald-900/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                      Auto-selected
                    </span>
                  )}
                  <span className="block text-xs uppercase tracking-wide text-zinc-500">
                    priority: {t.priority ?? '-'}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    due: {t.due_date ? t.due_date.slice(0, 10) : '-'} · est:{' '}
                    {t.estimated_duration ?? '-'}m
                  </span>
                  <button
                    type="button"
                    onClick={() => void rescheduleTask(t.id)}
                    className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900/20 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900/30"
                  >
                    Postpone
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 3️⃣ Bottom Section */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-sm font-medium text-zinc-900">All Tasks</h2>

          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            {showAdd ? 'Cancel' : 'Add task'}
          </button>
        </div>

        {showAdd && (
          <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
            <label className="block text-xs text-zinc-500" htmlFor="new-task-title">
              Task title *
            </label>
            <input
              id="new-task-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入任务标题"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleAddTask}
                disabled={saving}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewTitle('');
                }}
                disabled={saving}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <ul className="mt-4 space-y-2 text-sm">
          {tasks.length === 0 && (
            <li className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500">
              没有 tasks。
            </li>
          )}

          {tasks.map((t) => {
            const checked = t.is_today === true;
            const disabled = !checked && selectedCount >= 3;

            return (
              <li
                key={t.id}
                className={[
                  'flex flex-col gap-1 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between',
                  checked
                    ? 'border-emerald-400/60 bg-emerald-900/10'
                    : 'border-zinc-200 bg-zinc-50',
                ].join(' ')}
              >
                <label className="flex min-w-0 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled || updatingTop3Id === t.id}
                    onChange={(e) => void setTaskIsToday(t.id, e.target.checked)}
                    className="mt-1 h-4 w-4 accent-emerald-500"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900">
                      {t.title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      due: {t.due_date ? t.due_date.slice(0, 10) : '-'}
                    </div>
                  </div>
                </label>
                <div className="flex items-center gap-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    priority: {t.priority ?? '-'}
                  </div>
                  <button
                    type="button"
                    onClick={() => void rescheduleTask(t.id)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900/20 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900/30"
                  >
                    Postpone
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

