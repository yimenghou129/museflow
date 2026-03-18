import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

type PriorityStr = 'high' | 'medium' | 'low';

function extractJsonArray(content: string): unknown {
  // 优先直接解析
  try {
    return JSON.parse(content);
  } catch {
    // 再尝试裁剪数组区间，避免模型夹带了少量文本
  }

  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;

  const sliced = content.slice(start, end + 1);
  try {
    return JSON.parse(sliced);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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
      goalDescription?: string;
      goalId?: string;
    };

    const goalDescription = body.goalDescription?.trim();
    const goalId = body.goalId;

    if (!goalDescription) {
      return NextResponse.json(
        { error: 'goalDescription is required' },
        { status: 400 }
      );
    }

    // 太短无法分解，直接提示用户补充
    if (goalDescription.length < 8) {
      return NextResponse.json(
        { error: 'goalDescription is too short, please add more details.' },
        { status: 400 }
      );
    }

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    const PRIORITY_HINT = 'high | medium | low';
    const system = `You are an assistant that decomposes a user goal into an actionable execution plan.
Return ONLY a valid JSON array. No markdown, no commentary.

Output format (array length MUST be 5 to 8):
[
  {
    "title": string, // short, specific, immediately executable
    "duration": number, // minutes, 15-120
    "priority": "${PRIORITY_HINT}" // must be exactly one of: high, medium, low
  }
]

Rules:
- Each task must be concrete and executable (not abstract).
- duration must be within 15-120 (use best judgment).
- priority must be high/medium/low.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: `Goal description:\n${goalDescription}\n\nDecompose into 5-8 executable tasks as specified.`,
        },
      ],
    });

    const content =
      completion.choices[0]?.message?.content?.trim() ?? '[]';

    const parsed = extractJsonArray(content);
    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'AI returned invalid JSON array' },
        { status: 200 }
      );
    }

    const tasks = (parsed as unknown[])
      .map((t) => {
        if (!t || typeof t !== 'object') return null;
        const obj = t as Record<string, unknown>;

        const title = typeof obj.title === 'string' ? obj.title.trim() : '';
        const durationRaw = obj.duration;
        const durationNum =
          typeof durationRaw === 'number'
            ? durationRaw
            : typeof durationRaw === 'string'
              ? Number(durationRaw)
              : NaN;

        const priorityStr = typeof obj.priority === 'string' ? obj.priority : '';
        const priorityNormalized = priorityStr.toLowerCase() as PriorityStr;

        const validPriority: PriorityStr | null =
          priorityNormalized === 'high' ||
          priorityNormalized === 'medium' ||
          priorityNormalized === 'low'
            ? priorityNormalized
            : null;

        if (!title) return null;
        if (!Number.isFinite(durationNum)) return null;
        if (durationNum < 15) return null;
        if (durationNum > 120) return null;
        if (!validPriority) return null;

        return {
          title,
          duration: Math.round(durationNum),
          priority: validPriority,
        };
      })
      .filter(Boolean) as Array<{
      title: string;
      duration: number;
      priority: PriorityStr;
    }>;

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'AI returned empty tasks' },
        { status: 200 }
      );
    }

    const limited = tasks.slice(0, 8);

    return NextResponse.json({
      ok: true,
      tasks: limited,
      count: limited.length,
    });
  } catch (err) {
    console.error('tasks/generate-from-goal error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

