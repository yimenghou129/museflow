import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { StructuredDraft, StructuredDraftItem } from '@/types/brain-dump';

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
      rawText?: string;
      structuredJson?: StructuredDraft | unknown;
    };

    const rawText = body.rawText;
    const structuredJson = body.structuredJson;

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'rawText is required' },
        { status: 400 }
      );
    }

    if (structuredJson === undefined) {
      return NextResponse.json(
        { error: 'structuredJson is required' },
        { status: 400 }
      );
    }

    const { data: brainDump, error: brainError } = await supabase
      .from('BrainDump')
      .insert({
        user_id: user.id,
        raw_text: rawText,
      })
      .select('id')
      .single();

    if (brainError || !brainDump) {
      console.error('BrainDump insert error:', brainError);
      return NextResponse.json(
        { error: brainError?.message ?? 'Failed to save brain dump' },
        { status: 500 }
      );
    }

    const { data: draftPlan, error: draftError } = await supabase
      .from('DraftPlan')
      .insert({
        user_id: user.id,
        brain_dump_id: brainDump.id,
        structured_json: structuredJson,
        status: 'draft',
      })
      .select('id')
      .single();

    if (draftError || !draftPlan) {
      console.error('DraftPlan insert error:', draftError);
      return NextResponse.json(
        { error: draftError?.message ?? 'Failed to save draft plan' },
        { status: 500 }
      );
    }

    // 将结构化草案中的条目映射为 tasks（简单版本：全部标记为 todo，未绑定 goal）
    const draftArray: StructuredDraft | null = Array.isArray(structuredJson)
      ? (structuredJson as StructuredDraft)
      : null;

    if (draftArray && draftArray.length > 0) {
      const tasksToInsert = draftArray.map((item: StructuredDraftItem) => ({
        user_id: user.id,
        goal_id: null,
        title: item.title,
        estimated_duration: item.estimated_duration_minutes,
        priority: item.importance_level,
        status: 'todo',
        due_date: null,
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Tasks insert error (from draft):', tasksError);
        // 不阻断主流程，只在响应中返回 warning 方便前端提示/调试
        return NextResponse.json({
          brainDumpId: brainDump.id,
          draftPlanId: draftPlan.id,
          warning: 'draft_saved_but_tasks_insert_failed',
        });
      }
    }

    return NextResponse.json({
      brainDumpId: brainDump.id,
      draftPlanId: draftPlan.id,
    });
  } catch (err) {
    console.error('brain-dump/save error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 }
    );
  }
}
