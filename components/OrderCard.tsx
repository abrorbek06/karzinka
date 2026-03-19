'use client';

import { Order } from '@/types/orders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  new: 'Yangi',
  processing: 'Tayyorlashda',
  shipped: "Jo'natildi",
  delivered: 'Qabul qilindi',
  cancelled: 'Bekor qilindi',
};

const productStatusLabels = {
  bor: 'Bor',
  kutilmoqda: 'Kutilmoqda',
  'yo\'q': "Yo'q",
} as const;

const productStatusStyles = {
  bor: {
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  kutilmoqda: {
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  'yo\'q': {
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
} as const;

export function OrderCard({
  order,
  onClick,
  draggable = true,
  onDragStart,
}: OrderCardProps) {
  const pickupDate = new Date(order.pickupDate);
  const today = new Date();
  const isPickupToday =
    pickupDate.getFullYear() === today.getFullYear() &&
    pickupDate.getMonth() === today.getMonth() &&
    pickupDate.getDate() === today.getDate();
  const totalProducts = order.products.length;
  const availableCount = order.products.filter((product) => product.status === 'bor').length;
  const waitingCount = order.products.filter((product) => product.status === 'kutilmoqda').length;
  const missingCount = order.products.filter((product) => product.status === "yo'q").length;
  const completionPercent = totalProducts > 0
    ? Math.round((availableCount / totalProducts) * 100)
    : 0;
  const availablePercent = totalProducts > 0 ? (availableCount / totalProducts) * 100 : 0;
  const waitingPercent = totalProducts > 0 ? (waitingCount / totalProducts) * 100 : 0;
  const missingPercent = totalProducts > 0 ? (missingCount / totalProducts) * 100 : 0;

  const breakdownItems = [
    {
      key: 'bor',
      label: productStatusLabels.bor,
      count: availableCount,
      ...productStatusStyles.bor,
    },
    {
      key: 'kutilmoqda',
      label: productStatusLabels.kutilmoqda,
      count: waitingCount,
      ...productStatusStyles.kutilmoqda,
    },
    {
      key: "yo'q",
      label: productStatusLabels["yo'q"],
      count: missingCount,
      ...productStatusStyles["yo'q"],
    },
  ];

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-move hover:shadow-lg transition-shadow"
    >
      <Card className={`p-4 bg-white border hover:border-gray-300 ${isPickupToday ? 'border-red-300 shadow-red-100' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{order.id}</h4>
            <p className="text-xs text-gray-600 mt-1">{order.customerName}</p>
          </div>
          <Badge className={`text-xs px-2 py-1 ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <p className="font-medium text-gray-700">
                Progress: {availableCount}/{totalProducts}
              </p>
              <p className="font-semibold text-gray-600">{completionPercent}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="flex h-full w-full">
                {availablePercent > 0 ? (
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${availablePercent}%` }}
                  />
                ) : null}
                {waitingPercent > 0 ? (
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${waitingPercent}%` }}
                  />
                ) : null}
                {missingPercent > 0 ? (
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${missingPercent}%` }}
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {breakdownItems.map((item) => (
                <div
                  key={item.key}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${item.bgClass} ${item.textClass} ${item.borderClass}`}
                >
                  <span className={`h-2 w-2 rounded-full ${item.dotClass}`} />
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
            isPickupToday
              ? 'border-red-200 bg-red-50'
              : 'border-sky-100 bg-sky-50'
          }`}>
            <span className={`font-medium ${isPickupToday ? 'text-red-700' : 'text-sky-700'}`}>
              Olib kelish sanasi
            </span>
            <span className={`font-semibold ${isPickupToday ? 'text-red-900' : 'text-sky-900'}`}>
              {isPickupToday ? 'Bugun' : pickupDate.toLocaleDateString('uz-UZ')}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {order.totalAmount.toLocaleString('uz-UZ')} so'm
          </p>
        </div>
      </Card>
    </div>
  );
}
