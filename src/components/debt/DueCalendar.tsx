'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Debt } from '@/store/debtStore';

export function DueCalendar({ debts }: { debts: Debt[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ปฏิทินกำหนดจ่าย</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {debts.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
            <div className="text-xs text-slate-600">ครบกำหนดวันที่</div>
            <div className="text-2xl font-bold text-slate-900">{d.dueDay}</div>
            <div className="text-sm font-semibold text-slate-800">{d.name}</div>
            <div className="text-sm text-slate-600">฿ {d.amount.toLocaleString('th-TH')}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
