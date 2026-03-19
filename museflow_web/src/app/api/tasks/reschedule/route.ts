import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PriorityValue = number | string | null;

function calculateNewDueDate(dueDate: string | null, now: Date): string {
  const toYMDUTC = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const mm = String(m).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return { y, m, day, mm, dd };
  };

  const parseDue = (s: string) => {
    // due_date 可能是 YYYY-MM-DD，若带时间取前 10 位
    const v = s.length >= 10 ? s.slice(0, 10) : s;
    const parts = v.split('-').map((x) => Number(x));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    const [y, m, d] = parts;
    return { y, m, d };
  };

  const base = dueDate ? parseDue(dueDate) : null;

  // due_date 不存在 -> tomorrow（当前时间 + 1 天）
  if (!base) {
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const { y, mm, dd } = toYMDUTC(tomorrow);
    return `${y}-${mm}-${dd}`;
  }

  const { y, m, d } = base;
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const { mm, dd } = toYMDUTC(next);
  return `${y}-${mm}-${dd}`;
}

function calculateNewPriority(priority: PriorityValue): number | string | null {
  if (priority == null) {
    // priority 未设置时，按最低档处理（low）
    return 1;
  }

  if (typeof priority === 'string') {
    const p = priority.toLowerCase();
    if (p === 'high') return 'medium';
    if (p === 'medium') return 'low';
    if (p === 'low') return 'low';
    // 兼容未知字符串：尝试数值化后按数字降级
    const n = Number(p);
    if (Number.isFinite(n)) {
      return Math.max(1, n - 1);
    }
    return priority;
  }

  // number 类型：priority = priority - 1（clamp 最小值）
  if (!Number.isFinite(priority)) return 1;
  return Math.max(1, priority - 1);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { taskId } = (await request.json()) as { taskId?: string };
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, user_id, due_date, priority')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: taskError?.message ?? 'Task not found' },
        { status: 404 }
      );
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const newDueDate = calculateNewDueDate(task.due_date, now);
    const newPriority = calculateNewPriority(task.priority);

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        due_date: newDueDate,
        priority: newPriority as any, // DB 字段为 int，但这里兼容字符串输入
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      due_date: newDueDate,
      priority: newPriority,
    });
  } catch (err) {
    console.error('tasks/reschedule error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

