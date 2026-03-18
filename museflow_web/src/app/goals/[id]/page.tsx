'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Goal = {
  id: string;
  title: string;
  deadline: string | null;
  priority: number | null;
};

type Task = {
  id: string;
  title: string;
  estimated_duration: number | null;
  priority: number | null;
  status: string;
  due_date: string | null;
  created_at: string;
  is_top3?: boolean;
};

const STATUS_OPTIONS = [
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'done', label: '完成' },
] as const;

export default function GoalDetailPage() {
  const params = useParams();
  const goalId = params.id as string;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createDuration, setCreateDuration] = useState<string>('');
  const [createPriority, setCreatePriority] = useState<string>('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [goalDescription, setGoalDescription] = useState<string>('');
  const [decomposing, setDecomposing] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function fetchData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?next=/goals/${goalId}`);
      return;
    }
    const [goalRes, tasksRes] = await Promise.all([
      supabase.from('goals').select('id, title, deadline, priority').eq('id', goalId).single(),
      supabase.from('tasks').select('id, title, estimated_duration, priority, status, due_date, created_at, is_top3').eq('goal_id', goalId).order('created_at', { ascending: false }),
    ]);
    if (goalRes.error) {
      setError(goalRes.error.message);
      setGoal(null);
    } else {
      setGoal(goalRes.data);
      setError(null);
    }
    if (tasksRes.error) {
      setError((e) => e || tasksRes.error.message);
      setTasks([]);
    } else {
      setTasks(tasksRes.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!goalId) return;
    void fetchData();
  }, [goalId]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!createTitle.trim()) return;
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?next=/goals/${goalId}`);
      return;
    }
    const { error: err } = await supabase.from('tasks').insert({
      user_id: user.id,
      goal_id: goalId,
      title: createTitle.trim(),
      estimated_duration: createDuration ? parseInt(createDuration, 10) : null,
      priority: createPriority ? parseInt(createPriority, 10) : null,
      due_date: createDueDate || null,
      status: 'todo',
    });
    if (err) {
      setError(err.message);
    } else {
      setCreateTitle('');
      setCreateDuration('');
      setCreatePriority('');
      setCreateDueDate('');
      void fetchData();
    }
    setCreating(false);
  }

  async function handleStatusChange(taskId: string, status: string) {
    setUpdatingStatusId(taskId);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from('tasks').update({ status }).eq('id', taskId);
    if (err) setError(err.message);
    else void fetchData();
    setUpdatingStatusId(null);
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('确定删除这个 task？')) return;
    setDeletingId(id);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (err) setError(err.message);
    else void fetchData();
    setDeletingId(null);
  }

  async function handleAddToTop3(id: string) {
    setError(null);
    try {
      const res = await fetch('/api/tasks/today-top3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '设置 Top3 失败');
      } else {
        void fetchData();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '设置 Top3 失败');
    }
  }

  async function handleGenerateTasksFromGoal() {
    const description = goalDescription.trim();
    if (!description) {
      setError('请先输入 goal description');
      return;
    }
    if (description.length < 8) {
      setError('goal description 太短，请补充更具体的目标');
      return;
    }

    setDecomposing(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks/generate-from-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalDescription: description, goalId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '生成 tasks 失败');
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setGoalDescription('');
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成 tasks 失败');
    } finally {
      setDecomposing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-zinc-400">加载中…</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/goals" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Goals
        </Link>
        <p className="mt-4 text-zinc-400">Goal 不存在或无权访问。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/goals" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Goals
      </Link>
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h1 className="text-xl font-semibold text-zinc-50">{goal.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {goal.deadline ? `截止：${goal.deadline.slice(0, 10)}` : '无截止'}
          {goal.priority != null && ` · 优先级 ${goal.priority}`}
        </p>
      </div>

      {/* Goal description -> LLM -> tasks */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-medium text-zinc-300">
          Goal description → Generate Tasks
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          输入一个目标描述，系统会调用 LLM 自动生成 5-8 个可执行 tasks，并写入 Supabase。
        </p>
        <textarea
          value={goalDescription}
          onChange={(e) => setGoalDescription(e.target.value)}
          placeholder="例如：做一个 AI productivity app 并上线 MVP"
          className="mt-3 min-h-[100px] w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerateTasksFromGoal}
            disabled={decomposing}
            className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-200 disabled:opacity-50"
          >
            {decomposing ? 'Generating…' : 'Generate Tasks'}
          </button>
        </div>
      </div>

      <form onSubmit={handleCreateTask} className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-medium text-zinc-300">新建 task</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="task-title" className="block text-xs text-zinc-500">
              标题 *
            </label>
            <input
              id="task-title"
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Task 标题"
              required
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="task-duration" className="block text-xs text-zinc-500">
              预计时长（分钟）
            </label>
            <input
              id="task-duration"
              type="number"
              min={1}
              value={createDuration}
              onChange={(e) => setCreateDuration(e.target.value)}
              placeholder="30"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="task-priority" className="block text-xs text-zinc-500">
              优先级
            </label>
            <input
              id="task-priority"
              type="number"
              min={1}
              max={10}
              value={createPriority}
              onChange={(e) => setCreatePriority(e.target.value)}
              placeholder="1–10"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="task-due" className="block text-xs text-zinc-500">
              截止日期
            </label>
            <input
              id="task-due"
              type="date"
              value={createDueDate}
              onChange={(e) => setCreateDueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="mt-3 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {creating ? '创建中…' : '新建 task'}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400">
          我的 tasks（{tasks.length}）
        </h2>
        <ul className="mt-3 space-y-3">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <div>
                <p className={`font-medium ${t.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-50'}`}>
                  {t.title}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {t.estimated_duration != null && `${t.estimated_duration} 分钟`}
                  {t.priority != null && ` · 优先级 ${t.priority}`}
                  {t.due_date && ` · 截止 ${t.due_date.slice(0, 10)}`}
                </p>
              </div>
                <div className="flex min-w-[260px] items-center gap-2">
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  disabled={updatingStatusId === t.id}
                  className="rounded-lg border border-zinc-600 bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                    <button
                      type="button"
                      onClick={() => handleAddToTop3(t.id)}
                      className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900/40"
                    >
                      Add to Top3
                    </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(t.id)}
                  disabled={deletingId === t.id}
                  className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50"
                >
                  {deletingId === t.id ? '删除中…' : '删除'}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {tasks.length === 0 && (
          <p className="mt-4 text-sm text-zinc-500">暂无 tasks，在上方新建一个。</p>
        )}
      </section>
    </div>
  );
}
