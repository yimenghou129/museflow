import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { StructuredDraft, StructuredDraftItem } from '@/types/brain-dump';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STRUCTURE_SYSTEM = `You are a task structuring assistant. Given raw brain-dump text, output a JSON object with exactly one key: "items", which is an array of structured items. Each item must have these fields (use only these keys):
- category_suggestion (string): e.g. "work", "learning", "life"
- type (string): one of "task" | "project" | "goal"
- title (string): short title
- sub_tasks (array of strings, optional): breakdown
- estimated_duration_minutes (number): realistic minutes
- urgency_level (number 1-5): 5 = most urgent
- importance_level (number 1-5): 5 = most important
- energy_type (string): "deep" or "light"
- suggested_time_window (string, optional): e.g. "morning"
- rationale (string, optional): brief reason

Reply with ONLY a valid JSON object: { "items": [ ... ] }. No markdown or extra text.`;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const { rawText } = (await request.json()) as { rawText?: string };
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'rawText is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STRUCTURE_SYSTEM },
        {
          role: 'user',
          content: `Structure the following brain dump into a JSON array of tasks/projects/goals:\n\n${rawText}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content =
      completion.choices[0]?.message?.content?.trim() ?? '{}';
    // API may return { "items": [...] } or direct array
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON', fallback: [] },
        { status: 200 }
      );
    }

    const obj = parsed as { items?: unknown[] };
    const array = Array.isArray(obj?.items) ? obj.items : Array.isArray(parsed) ? parsed : [];
    const draft: StructuredDraft = Array.isArray(array)
      ? array.filter((item): item is StructuredDraftItem => {
          return (
            item &&
            typeof item === 'object' &&
            typeof (item as StructuredDraftItem).title === 'string' &&
            typeof (item as StructuredDraftItem).estimated_duration_minutes === 'number' &&
            ['task', 'project', 'goal'].includes((item as StructuredDraftItem).type) &&
            ['deep', 'light'].includes((item as StructuredDraftItem).energy_type)
          );
        })
      : [];

    return NextResponse.json({ items: draft });
  } catch (err) {
    console.error('brain-dump/structure error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Structure failed' },
      { status: 500 }
    );
  }
}
