'use client';

import { DebtPayment } from '@/store/debtStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';

export function PaymentHistory({ payments }: { payments: DebtPayment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ประวัติการจ่าย</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <THead>
            <tr>
              <TH>เมื่อ</TH>
              <TH>หนี้</TH>
              <TH>จำนวน</TH>
            </tr>
          </THead>
          <TBody>
            {payments.map((p) => (
              <tr key={p.id}>
                <TD>{new Date(p.paidAt).toLocaleString('th-TH')}</TD>
                <TD>{p.name || `#${p.debtId}`}</TD>
                <TD>฿ {p.amount.toLocaleString('th-TH')}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
