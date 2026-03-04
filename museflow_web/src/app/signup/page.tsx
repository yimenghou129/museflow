'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needConfirm, setNeedConfirm] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedConfirm(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback` },
      });
      if (err) {
        setError(err.message);
        return;
      }
      if (data?.user && !data.session) {
        setNeedConfirm(true);
        return;
      }
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-semibold text-zinc-50">注册</h1>
      <p className="mt-1 text-sm text-zinc-400">创建 MuseFlow 账号</p>
      {needConfirm ? (
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900/40 p-4 text-sm text-zinc-300">
          <p>已向 <strong className="text-zinc-50">{email}</strong> 发送确认邮件，请查收并点击链接完成注册。</p>
          <Link href="/login" className="mt-3 inline-block font-medium text-zinc-200 underline hover:no-underline">
            去登录 →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="至少 6 位"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? '注册中…' : '注册'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-zinc-400">
        已有账号？{' '}
        <Link href="/login" className="font-medium text-zinc-200 underline hover:no-underline">
          登录
        </Link>
      </p>
      <Link
        href="/"
        className="mt-4 text-center text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
