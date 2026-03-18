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

    // 先确保这条 task 属于当前用户
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, user_id, is_top3, created_at')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json(
        { error: fetchError?.message ?? 'Task not found' },
        { status: 404 },
      );
    }

    if (task.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      );
    }

    // 如果已经是 Top3，就直接返回（后续可以做取消逻辑）
    if (task.is_top3) {
      return NextResponse.json({ ok: true });
    }

    // 找出当前用户所有 is_top3=true 的任务，按 created_at 升序（最早的在前）
    const { data: currentTop3, error: topError } = await supabase
      .from('tasks')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('is_top3', true)
      .order('created_at', { ascending: true });

    if (topError) {
      return NextResponse.json(
        { error: topError.message },
        { status: 500 },
      );
    }

    const toUnset =
      currentTop3 && currentTop3.length >= 3 ? currentTop3[0]?.id : null;

    // 开始更新：如果已有 3 个，则取消最早的那个，再把新任务设为 top3
    if (toUnset) {
      const { error: unsetError } = await supabase
        .from('tasks')
        .update({ is_top3: false })
        .eq('id', toUnset);
      if (unsetError) {
        return NextResponse.json(
          { error: unsetError.message },
          { status: 500 },
        );
      }
    }

    const { error: setError } = await supabase
      .from('tasks')
      .update({ is_top3: true })
      .eq('id', taskId);

    if (setError) {
      return NextResponse.json(
        { error: setError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('tasks/top3 error:', err);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}

