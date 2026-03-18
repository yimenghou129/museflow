import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const { taskId } = (await request.json()) as { taskId?: string };
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 },
      );
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, user_id, is_today')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: taskError?.message ?? 'Task not found' },
        { status: 404 },
      );
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (task.is_today) {
      return NextResponse.json({ ok: true });
    }

    const { data: todayTop3 } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_today', true);

    const selectedCount = Array.isArray(todayTop3) ? todayTop3.length : 0;
    if (selectedCount >= 3) {
      return NextResponse.json(
        { error: 'Top3 已满：请先取消一个任务再添加。' },
        { status: 409 },
      );
    }

    const { error: setError } = await supabase
      .from('tasks')
      .update({ is_today: true })
      .eq('id', taskId);

    if (setError) {
      return NextResponse.json(
        { error: setError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('tasks/today-top3 error:', err);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}

