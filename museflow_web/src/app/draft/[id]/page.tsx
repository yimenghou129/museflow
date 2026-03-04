import Link from 'next/link';

export default async function DraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <Link
            href="/brain-dump"
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← Brain Dump
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            编辑草案
          </h1>
          <p className="mt-1 text-zinc-600">
            Draft ID: {id} · 协作编辑（分类、时长、优先级、MUST）接入后在此展示。
          </p>
        </header>
      </div>
    </div>
  );
}
