'use client';

import { useEffect, useState } from 'react';
import { useDebtStore } from '@/store/debtStore';
import { ReserveSummary } from '@/components/debt/ReserveSummary';
import { DebtList } from '@/components/debt/DebtList';
import { DebtForm } from '@/components/debt/DebtForm';
import { DueCalendar } from '@/components/debt/DueCalendar';
import { PaymentHistory } from '@/components/debt/PaymentHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DebtManagerPage() {
  const { debts, payments, summary, reserveToday, fetchDebts, fetchPayments, fetchSummary, calculateToday, addPayment } = useDebtStore();
  const [payForm, setPayForm] = useState({ debtId: 0, amount: 0 });

  useEffect(() => {
    fetchDebts();
    fetchPayments();
    fetchSummary();
  }, [fetchDebts, fetchPayments, fetchSummary]);

  const submitPayment = async () => {
    if (!payForm.debtId || !payForm.amount) return;
    await addPayment(payForm);
    setPayForm({ debtId: 0, amount: 0 });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-600">กันเงินแต่ละวันเพื่อจ่ายหนี้ปลายเดือน</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Debt Manager</h1>
      </div>

      <ReserveSummary summary={summary} onCalculate={calculateToday} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DebtForm />
        <Card>
          <CardHeader>
            <CardTitle>บันทึกการจ่าย</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Input
              list="debt-options"
              placeholder="เลือกหนี้ (ID)"
              value={payForm.debtId || ''}
              onChange={(e) => setPayForm((f) => ({ ...f, debtId: Number(e.target.value) }))}
            />
            <datalist id="debt-options">
              {debts.map((d) => (
                <option key={d.id} value={d.id}>{`${d.name} • ฿${d.amount}`}</option>
              ))}
            </datalist>
            <Input
              type="number"
              placeholder="จำนวนเงิน"
              value={payForm.amount || ''}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            />
            <Button onClick={submitPayment} className="sm:col-span-1">บันทึกการจ่าย</Button>
          </CardContent>
        </Card>
      </div>

      <DebtList debts={debts} />
      <DueCalendar debts={debts} />
      <PaymentHistory payments={payments} />
    </div>
  );
}
