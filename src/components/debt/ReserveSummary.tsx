'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ReserveSummary as ReserveSummaryType } from '@/store/debtStore';

export function ReserveSummary({ summary, onCalculate }: { summary: ReserveSummaryType | null; onCalculate: () => void }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>สรุปเงินกันหนี้</CardTitle>
        <Button size="sm" onClick={onCalculate}>คำนวณวันนี้</Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="วันนี้ต้องกัน" value={summary?.today ?? 0} tone="primary" />
        <Stat label="สะสมเดือนนี้" value={summary?.monthCollected ?? 0} />
        <Stat label="ต้องใช้เดือนนี้" value={summary?.needThisMonth ?? 0} />
        <Stat label="ขาดอีก" value={summary?.remaining ?? 0} tone="warn" />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'primary' | 'warn' }) {
  const color = tone === 'primary' ? 'text-emerald-700' : tone === 'warn' ? 'text-rose-700' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-600">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>฿ {value.toLocaleString('th-TH')}</div>
    </div>
  );
}
