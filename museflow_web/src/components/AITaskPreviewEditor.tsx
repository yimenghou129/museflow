'use client';

import { useEffect, useMemo, useState } from 'react';

type Priority = 'high' | 'medium' | 'low';

export type PreviewTask = {
  tempId: string;
  title: string;
  duration: number | '';
  priority: Priority | '';
};

export function AITaskPreviewEditor({
  initialTasks,
  onCancel,
  onConfirm,
  confirming,
}: {
  initialTasks: PreviewTask[];
  onCancel: () => void;
  onConfirm: (tasks: PreviewTask[]) => Promise<void> | void;
  confirming: boolean;
}) {
  const [tasks, setTasks] = useState<PreviewTask[]>(initialTasks);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const validCount = useMemo(
    () =>
      tasks.filter((t) => t.title.trim() && typeof t.duration === 'number' && t.duration > 0 && t.priority).length,
    [tasks]
  );

  function updateTask(tempId: string, patch: Partial<PreviewTask>) {
    setTasks((prev) => prev.map((t) => (t.tempId === tempId ? { ...t, ...patch } : t)));
    setLocalError(null);
  }

  function deleteTask(tempId: string) {
    setTasks((prev) => prev.filter((t) => t.tempId !== tempId));
    setLocalError(null);
  }

  async function handleConfirm() {
    setLocalError(null);
    if (tasks.length === 0) {
      setLocalError('预览任务为空，请至少保留一条再保存。');
      return;
    }

    const invalid = tasks.some(
      (t) =>
        !t.title.trim() ||
        typeof t.duration !== 'number' ||
        !Number.isFinite(t.duration) ||
        t.duration <= 0 ||
        !t.priority
    );
    if (invalid) {
      setLocalError('请确保每条 task 的 title、duration 和 priority 都填写正确。');
      return;
    }

    // 这里把校验通过的 tasks 直接交给父组件保存
    await onConfirm(tasks);
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-sm font-medium text-zinc-300">
        Review AI-generated tasks
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        You can edit before saving.（你可以编辑并删除后再确认保存）
      </p>

      <ul className="mt-4 space-y-3">
        {tasks.map((t) => (
          <li
            key={t.tempId}
            className="rounded-lg border border-zinc-700/80 bg-zinc-900/50 p-3"
          >
            <div className="grid gap-3 sm:grid-cols-[1.8fr,1fr,1fr,auto] sm:items-end">
              <div className="sm:col-span-1">
                <label className="block text-xs text-zinc-500">title *</label>
                <input
                  type="text"
                  value={t.title}
                  onChange={(e) => updateTask(t.tempId, { title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500">duration *</label>
                <input
                  type="number"
                  value={t.duration}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateTask(t.tempId, {
                      duration: v === '' ? '' : Number(v),
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  min={1}
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500">priority *</label>
                <select
                  value={t.priority}
                  onChange={(e) => updateTask(t.tempId, { priority: e.target.value as Priority | '' })}
                  className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/60 px-3 py-2 text-zinc-50 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="">Select</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => deleteTask(t.tempId)}
                  className="w-full rounded-lg border border-red-700/60 bg-red-900/20 px-3 py-2 text-sm text-red-300 hover:bg-red-900/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {localError && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {localError}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={confirming}
          className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900/70 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming || tasks.length === 0 || validCount === 0}
          className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-200 disabled:opacity-50"
        >
          {confirming ? 'Saving…' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  );
}

