'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Goal = {
  id: string;
  user_id: string;
  title: string;
  deadline: string | null;
  priority: number | null;
  created_at: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createDeadline, setCreateDeadline] = useState('');
  const [createPriority, setCreatePriority] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function fetchGoals() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login?next=/goals');
      return;
    }
    const { data, error: err } = await supabase
      .from('goals')
      .select('id, user_id, title, deadline, priority, created_at')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setGoals([]);
    } else {
      setGoals(data ?? []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void fetchGoals();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createTitle.trim()) return;
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login?next=/goals');
      return;
    }
    const { error: err } = await supabase.from('goals').insert({
      user_id: user.id,
      title: createTitle.trim(),
      deadline: createDeadline || null,
      priority: createPriority ? parseInt(createPriority, 10) : null,
    });
    if (err) {
      setError(err.message);
    } else {
      setCreateTitle('');
      setCreateDeadline('');
      setCreatePriority('');
      void fetchGoals();
    }
    setCreating(false);
  }

  function startEdit(g: Goal) {
    setEditingId(g.id);
    setEditTitle(g.title);
    setEditDeadline(g.deadline ? g.deadline.slice(0, 10) : '');
    setEditPriority(g.priority != null ? String(g.priority) : '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('goals')
      .update({
        title: editTitle.trim(),
        deadline: editDeadline || null,
        priority: editPriority ? parseInt(editPriority, 10) : null,
      })
      .eq('id', editingId);
    if (err) {
      setError(err.message);
    } else {
      setEditingId(null);
      void fetchGoals();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除这个 goal？')) return;
    setDeletingId(id);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from('goals').delete().eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      void fetchGoals();
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-zinc-400">加载中…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← MuseFlow
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-50">Goals</h1>
      <p className="mt-1 text-sm text-zinc-400">
        新建、编辑、删除 goal。数据保存在 Supabase，仅展示当前用户的 goals。
      </p>

      <form onSubmit={handleCreate} className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-medium text-zinc-300">新建 goal</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="create-title" className="block text-xs text-zinc-500">
              标题 *
            </label>
            <input
              id="create-title"
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Goal 标题"
              required
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="create-deadline" className="block text-xs text-zinc-500">
              截止日期
            </label>
            <input
              id="create-deadline"
              type="date"
              value={createDeadline}
              onChange={(e) => setCreateDeadline(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <div className="w-24">
            <label htmlFor="create-priority" className="block text-xs text-zinc-500">
              优先级
            </label>
            <input
              id="create-priority"
              type="number"
              min={1}
              max={10}
              value={createPriority}
              onChange={(e) => setCreatePriority(e.target.value)}
              placeholder="1–10"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {creating ? '创建中…' : '新建'}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400">
          我的 goals（{goals.length}）
        </h2>
        <ul className="mt-3 space-y-3">
          {goals.map((g) =>
            editingId === g.id ? (
              <li key={g.id} className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500">标题 *</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500">截止日期</label>
                      <input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500">优先级</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="mt-1 w-20 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {saving ? '保存中…' : '保存'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-50"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={g.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="min-w-0 flex-1">
                  <Link href={`/goals/${g.id}`} className="font-medium text-zinc-50 hover:text-zinc-200">
                    {g.title}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">
                    {g.deadline ? `截止：${g.deadline.slice(0, 10)}` : '无截止'}
                    {g.priority != null && ` · 优先级 ${g.priority}`}
                    <span className="ml-1 text-zinc-600">· 点击进入 tasks</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-50"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    disabled={deletingId === g.id}
                    className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {deletingId === g.id ? '删除中…' : '删除'}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
        {goals.length === 0 && !loading && (
          <p className="mt-4 text-sm text-zinc-500">暂无 goals，在上方新建一个。</p>
        )}
      </section>
    </div>
  );
}
