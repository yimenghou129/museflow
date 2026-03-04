import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { StructuredDraft } from '@/types/brain-dump';

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
