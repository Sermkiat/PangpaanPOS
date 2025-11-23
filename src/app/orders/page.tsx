'use client';

import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { orders, updateOrderStatus } = usePosStore();
  const columns = ['pending', 'prepping', 'ready', 'served'] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-orange-700">Kitchen queue</p>
          <h1 className="text-2xl font-extrabold text-orange-950">Orders</h1>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((status) => (
          <Card key={status}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="capitalize">{status}</CardTitle>
              <Badge tone={status === 'ready' ? 'green' : status === 'pending' ? 'orange' : 'gray'}>
                {orders.filter((o) => o.status === status).length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders
                .filter((o) => o.status === status)
                .map((order) => (
                  <div key={order.id} className="rounded-lg bg-orange-50 p-3 shadow-inner shadow-orange-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-semibold">{order.orderNumber}</div>
                      <span className="text-orange-700">
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-orange-900">
                      {order.items.map((it) => (
                        <li key={it.productId} className="flex justify-between">
                          <span>{it.qty} × {it.name}</span>
                          <span>฿ {(it.unitPrice * it.qty).toFixed(0)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-orange-700">Pay: {order.paymentMethod}</span>
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
    </div>
  );
}
