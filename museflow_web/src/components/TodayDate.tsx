'use client';

import { useState, useEffect } from 'react';

/**
 * 在浏览器端渲染当前日期，使用用户系统时区（与系统时间一致）。
 */
export function TodayDate() {
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const format = () => {
      const str = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      });
      setDateStr(str);
    };
    format();
    const t = setInterval(format, 60_000);
    return () => clearInterval(t);
  }, []);

  if (!dateStr) {
    return <span className="text-sm text-zinc-500">—</span>;
  }
  return <span className="text-sm text-zinc-500">{dateStr}</span>;
}
