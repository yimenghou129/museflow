import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TodayPageClient } from '@/components/TodayPageClient';
import { generateTop3ForToday } from '@/lib/today/generateTop3ForToday';

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: number | null;
  estimated_duration: number | null;
  status: string;
  is_today: boolean | null;
};

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/today');
  }

  // 先看是否已经存在手动选择的 Top3（is_today=true）
  const { data: existingTop3Raw } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_today', true)
    .neq('status', 'done');

  const hasExistingTop3 =
    Array.isArray(existingTop3Raw) && existingTop3Raw.length > 0;

  let autoRecommended = false;
  if (!hasExistingTop3) {
    autoRecommended = true;
    await generateTop3ForToday({ supabase, userId: user.id });
  }

  const { data: tasksRaw } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, status, is_today, estimated_duration')
    .eq('user_id', user.id)
    .neq('status', 'done')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  const tasks: Task[] = Array.isArray(tasksRaw) ? tasksRaw : [];

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← MuseFlow
          </Link>
        </header>

        <TodayPageClient
          initialTasks={tasks}
          autoRecommended={autoRecommended}
        />
      </div>
    </div>
  );
}
