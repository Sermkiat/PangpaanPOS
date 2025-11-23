'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [form, setForm] = useState({ shopName: 'Pangpaan', address: 'Bangkok', promptpay: '086-xxx-xxxx', timezone: 'Asia/Bangkok' });
  const save = () => alert('Settings saved locally for now.');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">Configuration</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Shop</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} placeholder="Shop name" />
          <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" />
          <Input value={form.promptpay} onChange={(e) => setForm((f) => ({ ...f, promptpay: e.target.value }))} placeholder="PromptPay ID" />
          <Input value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} placeholder="Timezone" />
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={save}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
