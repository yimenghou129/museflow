import Link from 'next/link';

export default function TodayPage() {
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
            Today
          </h1>
          <p className="mt-1 text-zinc-600">
            今日 Top 3 · 剩余容量 · 快捷操作（完成 / 延期 / 我卡住了）
          </p>
        </header>
        <p className="text-zinc-500">
          排期与今日任务数据接入后，将在此展示。
        </p>
      </div>
    </div>
  );
}
