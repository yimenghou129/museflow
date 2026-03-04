'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function AuthBar({ user }: { user: User | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/login"
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-zinc-300 hover:border-zinc-500 hover:text-zinc-50"
        >
          登录
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-200"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-zinc-400">{user.email}</span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-50"
      >
        退出
      </button>
    </div>
  );
}
