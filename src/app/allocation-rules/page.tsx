'use client';

import { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AllocationRulesPage() {
  const { allocationRules, addAllocationRule } = usePosStore();
  const [form, setForm] = useState({ name: 'COGS', ruleType: 'percentage', percentage: 10, target: 'Sales', active: true });

  const submit = () => {
    if (!form.name) return;
    addAllocationRule(form);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">Profit allocation</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Allocation Rules</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create rule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
          <Input value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} placeholder="Target" />
          <Input
            type="number"
            value={form.percentage}
            onChange={(e) => setForm((f) => ({ ...f, percentage: Number(e.target.value) }))}
            placeholder="%"
          />
          <Button onClick={submit}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Target</TH>
                <TH>%</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {allocationRules.map((r) => (
                <tr key={r.id}>
                  <TD>{r.name}</TD>
                  <TD>{r.target}</TD>
                  <TD>{r.percentage}%</TD>
                  <TD>
                    <Badge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Paused'}</Badge>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
