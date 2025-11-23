'use client';

import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useMemo } from 'react';

export default function OrdersPage() {
  const { orders, updateOrderStatus } = usePosStore();
  const columns = ['pending', 'prepping', 'ready', 'served'] as const;
  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">Kitchen queue & sales history</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Orders</h1>
        </div>
        <div className="text-right text-sm text-slate-700">
          <div className="font-semibold text-slate-900">ยอดขายรวม ฿ {totalRevenue.toFixed(2)}</div>
          <div>{orders.length} orders</div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((status) => (
          <Card key={status}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="capitalize">{status}</CardTitle>
              <Badge tone={status === 'ready' ? 'green' : status === 'pending' ? 'gray' : 'gray'}>
                {orders.filter((o) => o.status === status).length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders
                .filter((o) => o.status === status)
                .map((order) => (
                  <div key={order.id} className="rounded-lg border border-slate-200 p-3 shadow-sm bg-white">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-semibold">{order.orderNumber}</div>
                      <span className="text-slate-600">
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-900">
                      {order.items.map((it) => (
                        <li key={it.productId} className="flex justify-between">
                          <span>{it.qty} × {it.name}</span>
                          <span>฿ {(it.unitPrice * it.qty).toFixed(0)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-700">Pay: {order.paymentMethod}</span>
                      <span className="font-semibold">฿ {order.total.toFixed(0)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {columns.map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          variant={next === order.status ? 'primary' : 'secondary'}
                          onClick={() => updateOrderStatus(order.id, next)}
                        >
                          {next}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedOrders.slice(0, 20).map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>{order.orderNumber}</span>
                  <Badge tone={order.status === 'served' ? 'green' : 'gray'}>{order.status}</Badge>
                  <Badge tone="blue">{order.paymentMethod}</Badge>
                </div>
                <div className="text-xs text-slate-600">{format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}</div>
              </div>
              <div className="text-right font-semibold text-slate-900">฿ {order.total.toFixed(2)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
