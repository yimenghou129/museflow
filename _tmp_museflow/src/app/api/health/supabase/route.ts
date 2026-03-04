import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 尝试从 BrainDump 读取一行数据，用于测试与数据库和 RLS 的连通性
    const { data, error } = await supabase
      .from('BrainDump')
      .select('id, created_at')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          code: error.code,
          hint: 'Supabase reachable, but query failed (likely auth/RLS or empty table).',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        rows: data,
        message: 'Supabase query succeeded.',
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

