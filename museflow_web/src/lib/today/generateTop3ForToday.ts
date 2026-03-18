import type { SupabaseClient } from '@supabase/supabase-js';

type CandidateTask = {
  id: string;
  title: string | null;
  priority: number | string | null;
  due_date: string | null;
  estimated_duration: number | null;
  created_at: string | null;
};

function priorityScore(p: CandidateTask['priority']): number {
  // DB 中 tasks.priority 当前是 int；但我们兼容数字或字符串
  if (p == null) return 1;
  if (typeof p === 'string') {
    const normalized = p.toLowerCase();
    if (normalized === 'high') return 3;
    if (normalized === 'medium') return 2;
    if (normalized === 'low') return 1;
    const n = Number(p);
    if (Number.isFinite(n)) return n >= 3 ? 3 : n === 2 ? 2 : 1;
    return 1;
  }
  if (typeof p === 'number') {
    if (!Number.isFinite(p)) return 1;
    return p >= 3 ? 3 : p === 2 ? 2 : 1;
  }
  return 1;
}

function parseDateToUTCms(d: string | null): number {
  // due_date 是 date（YYYY-MM-DD），用 UTC 避免本地时区差异
  if (!d) return Number.POSITIVE_INFINITY;
  const parts = d.split('-').map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return Number.POSITIVE_INFINITY;
  }
  const [y, m, day] = parts;
  return Date.UTC(y, m - 1, day);
}

function parseDuration(d: number | null): number {
  return d != null && Number.isFinite(d) ? d : Number.POSITIVE_INFINITY;
}

function rankTasksForToday(candidates: CandidateTask[]): CandidateTask[] {
  // 排序规则：
  // 1) priority 高优先
  // 2) due_date 更近优先（null 排后）
  // 3) estimated_duration 更短优先（null 排后）
  return [...candidates].sort((a, b) => {
    const ap = priorityScore(a.priority);
    const bp = priorityScore(b.priority);
    if (bp !== ap) return bp - ap;

    const ad = parseDateToUTCms(a.due_date);
    const bd = parseDateToUTCms(b.due_date);
    if (ad !== bd) return ad - bd;

    const at = parseDuration(a.estimated_duration);
    const bt = parseDuration(b.estimated_duration);
    if (at !== bt) return at - bt;

    const ac = a.created_at ? Date.parse(a.created_at) : 0;
    const bc = b.created_at ? Date.parse(b.created_at) : 0;
    return ac - bc;
  });
}

export async function generateTop3ForToday(params: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<{ selectedIds: string[] }> {
  const { supabase, userId } = params;

  const { data: candidatesRaw, error: fetchError } = await supabase
    .from('tasks')
    .select(
      'id, title, priority, due_date, estimated_duration, created_at'
    )
    .eq('user_id', userId)
    .neq('status', 'done')
    .or('is_today.eq.false,is_today.is.null')
    .order('created_at', { ascending: true });

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const candidates: CandidateTask[] = (Array.isArray(candidatesRaw)
    ? candidatesRaw
    : []
  ).filter((t: CandidateTask) => !!t.title && t.title.trim().length > 0);

  if (candidates.length === 0) return { selectedIds: [] };

  // 候选筛选：estimated_duration <= 60（如果全部都 > 60，则 fallback 忽略 duration 条件）
  const within60 = candidates.filter(
    (t) => t.estimated_duration != null && t.estimated_duration <= 60
  );
  const filtered = within60.length > 0 ? within60 : candidates;

  const ranked = rankTasksForToday(filtered);
  const selectedIds = ranked.slice(0, 3).map((t) => t.id);

  if (selectedIds.length === 0) return { selectedIds: [] };

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ is_today: true })
    .in('id', selectedIds)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { selectedIds };
}

