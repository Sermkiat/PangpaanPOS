'use client';

import { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';

export default function ExpensesPage() {
  const { expenses, addExpense } = usePosStore();
  const [form, setForm] = useState({ category: 'Supplies', description: '', amount: 0 });

  const submit = () => {
    if (!form.description || !form.amount) return;
    addExpense(form);
    setForm({ category: form.category, description: '', amount: 0 });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">Track spend</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Expense Log</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add expense</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <Input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Amount"
            value={form.amount || ''}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          />
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={submit}>Save expense</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Category</TH>
                <TH>Description</TH>
                <TH>Amount</TH>
              </tr>
            </THead>
            <TBody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <TD>{new Date(e.date).toLocaleString()}</TD>
                  <TD>{e.category}</TD>
                  <TD>{e.description}</TD>
                  <TD>฿ {e.amount.toFixed(2)}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
