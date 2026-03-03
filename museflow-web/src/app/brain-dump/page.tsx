'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { StructuredDraftItem } from '@/types/brain-dump';

export default function BrainDumpPage() {
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<StructuredDraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!rawText.trim()) {
      setError('请先输入一些内容');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/brain-dump/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '生成失败');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (items.length === 0) {
      setError('请先生成草案再保存');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/brain-dump/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawText.trim(),
          structuredJson: items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '保存失败');
      setSavedDraftId(data.draftPlanId);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

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
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Brain Dump
          </h1>
          <p className="mt-1 text-zinc-600">
            把脑子里的事倒出来，AI 会帮你整理成可执行的结构。
          </p>
        </header>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="随便写：待办、想法、项目名、截止日期……不用管格式"
          className="w-full min-h-[200px] rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          disabled={loading}
        />

        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? '生成中…' : '生成结构化草案'}
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {saving ? '保存中…' : '保存草案'}
            </button>
          )}
        </div>

        {savedDraftId && (
          <p className="mt-4 text-sm text-green-700">
            已保存。{' '}
            <Link
              href={`/draft/${savedDraftId}`}
              className="font-medium underline hover:no-underline"
            >
              去编辑草案 →
            </Link>
          </p>
        )}

        {items.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-medium text-zinc-900">
              结构化草案（{items.length} 条）
            </h2>
            <ul className="mt-3 space-y-3">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-zinc-500">
                        {item.category_suggestion} · {item.type}
                      </span>
                      <p className="mt-1 font-medium text-zinc-900">
                        {item.title}
                      </p>
                      {item.sub_tasks && item.sub_tasks.length > 0 && (
                        <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
                          {item.sub_tasks.map((st, j) => (
                            <li key={j}>{st}</li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-2 text-xs text-zinc-500">
                        {item.estimated_duration_minutes} 分钟 ·{' '}
                        {item.energy_type === 'deep' ? '深度' : '轻量'} · 紧急{' '}
                        {item.urgency_level}/5 · 重要 {item.importance_level}/5
                        {item.suggested_time_window &&
                          ` · ${item.suggested_time_window}`}
                      </p>
                      {item.rationale && (
                        <p className="mt-1 text-xs italic text-zinc-500">
                          {item.rationale}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
