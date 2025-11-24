'use client';

import { Debt } from '@/store/debtStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function DebtList({ debts }: { debts: Debt[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>หนี้ทั้งหมด</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <THead>
            <tr>
              <TH>ชื่อ</TH>
              <TH>ชนิด</TH>
              <TH>ยอด/เดือน</TH>
              <TH>ยอดรวม</TH>
              <TH>วันครบกำหนด</TH>
            </tr>
          </THead>
          <TBody>
            {debts.map((d) => (
              <tr key={d.id}>
                <TD className="font-semibold text-slate-900">{d.name}</TD>
                <TD><Badge tone="blue">{d.type}</Badge></TD>
                <TD>฿ {d.amount.toLocaleString('th-TH')}</TD>
                <TD>{d.totalDebt ? `฿ ${d.totalDebt.toLocaleString('th-TH')}` : '-'}</TD>
                <TD>ทุกวันที่ {d.dueDay}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
