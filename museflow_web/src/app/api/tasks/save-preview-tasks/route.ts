import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PriorityStr = 'high' | 'medium' | 'low';

function priorityToInt(p: PriorityStr): number {
  if (p === 'high') return 3;
  if (p === 'medium') return 2;
  return 1;
}

function isPriorityStr(v: unknown): v is PriorityStr {
  return v === 'high' || v === 'medium' || v === 'low';
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

    const body = (await request.json()) as {
      goalId?: string;
      tasks?: Array<{
        title?: string;
        duration?: unknown;
        priority?: unknown;
      }>;
    };

    const goalId = body.goalId;
    const tasksInput = body.tasks;

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tasksInput) || tasksInput.length === 0) {
      return NextResponse.json(
        { error: 'tasks must be a non-empty array' },
        { status: 400 }
      );
    }

    const tasksToInsert = tasksInput
      .slice(0, 8)
      .map((t) => {
        const title = typeof t.title === 'string' ? t.title.trim() : '';
        const durationNum =
          typeof t.duration === 'number'
            ? t.duration
            : typeof t.duration === 'string'
              ? Number(t.duration)
              : NaN;

        const priorityRaw = t.priority;
        if (!title) return null;
        if (!Number.isFinite(durationNum)) return null;
        if (durationNum <= 0) return null;
        if (!isPriorityStr(priorityRaw)) return null;

        return {
          user_id: user.id,
          goal_id: goalId,
          title,
          estimated_duration: Math.round(durationNum),
          priority: priorityToInt(priorityRaw),
          status: 'todo',
          due_date: null,
          is_today: false,
        };
      })
      .filter(Boolean) as Array<{
      user_id: string;
      goal_id: string;
      title: string;
      estimated_duration: number;
      priority: number;
      status: 'todo';
      due_date: null;
      is_today: false;
    }>;

    if (tasksToInsert.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid tasks to insert. Please ensure title is not empty, duration > 0, and priority is selected.',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('tasks').insert(tasksToInsert);
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, count: tasksToInsert.length });
  } catch (err) {
    console.error('tasks/save-preview-tasks error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

