'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebtStore } from '@/store/debtStore';

export function DebtForm() {
  const addDebt = useDebtStore((s) => s.addDebt);
  const [form, setForm] = useState({
    name: '',
    amount: 0,
    dueDay: 1,
    type: 'card',
    minimumPay: 0,
    totalDebt: 0,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name || !form.amount || !form.dueDay) return;
    setSaving(true);
    try {
      await addDebt({ ...form });
      setForm({ name: '', amount: 0, dueDay: 1, type: 'card', minimumPay: 0, totalDebt: 0, notes: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>เพิ่มหนี้ใหม่</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Input placeholder="ชื่อหนี้ เช่น KTC" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <Input type="number" placeholder="ยอด/เดือน" value={form.amount || ''} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} />
        <Input type="number" placeholder="วันครบกำหนด (1-31)" value={form.dueDay || ''} onChange={(e) => setForm((f) => ({ ...f, dueDay: Number(e.target.value) }))} />
        <Input placeholder="ประเภท (card/loan/etc.)" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
        <Input type="number" placeholder="ยอดขั้นต่ำ" value={form.minimumPay || ''} onChange={(e) => setForm((f) => ({ ...f, minimumPay: Number(e.target.value) }))} />
        <Input type="number" placeholder="ยอดหนี้รวม" value={form.totalDebt || ''} onChange={(e) => setForm((f) => ({ ...f, totalDebt: Number(e.target.value) }))} />
        <Input className="md:col-span-2" placeholder="หมายเหตุ" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={submit} disabled={saving}>บันทึกหนี้</Button>
        </div>
      </CardContent>
    </Card>
  );
}
