'use client';

import { useState } from 'react';
import { Order, OrderStatus, ProductStatus } from '@/types/orders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OrderDetailProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void> | void;
  onProductPriceChange?: (orderId: string, productId: string, newPrice: number) => Promise<void> | void;
  onProductStatusChange?: (orderId: string, productId: string, newStatus: ProductStatus) => Promise<void> | void;
  availableStatuses: OrderStatus[];
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

const productStatusSelectedColors: Record<string, string> = {
  bor: 'bg-green-600 text-white hover:bg-green-700',
  kutilmoqda: 'bg-yellow-500 text-black hover:bg-yellow-600',
  'yo\'q': 'bg-red-600 text-white hover:bg-red-700',
};

const productStatusLabels: Record<string, string> = {
  bor: 'Bor',
  kutilmoqda: 'Kutilmoqda',
  'yo\'q': 'Yo\'q',
};

export function OrderDetail({
  order,
  open,
  onOpenChange,
  onStatusChange,
  onProductPriceChange,
  onProductStatusChange,
  availableStatuses,
}: OrderDetailProps) {
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  if (!order) return null;

  const handlePriceChange = (productId: string, newPrice: number) => {
    setEditingPrices({ ...editingPrices, [productId]: newPrice });
  };

  const handleSavePrice = async (productId: string) => {
    if (onProductPriceChange) {
      const price = editingPrices[productId];
      if (price === undefined || Number.isNaN(price)) return;

      setSavingProductId(productId);
      try {
        await onProductPriceChange(order.id, productId, price);
        setEditingPrices((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      } finally {
        setSavingProductId(null);
      }
    }
  };

  const handleStatusUpdate = async (status: OrderStatus) => {
    setSavingStatus(true);
    try {
      await onStatusChange(order.id, status);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleProductStatusUpdate = async (productId: string, status: ProductStatus) => {
    if (!onProductStatusChange) return;

    setSavingProductId(productId);
    try {
      await onProductStatusChange(order.id, productId, status);
    } finally {
      setSavingProductId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">{order.id}</DialogTitle>
          <DialogDescription className='text-slate-400'>
            Buyurtmaning to'liq ma'lumotlari va statusini o'zgartiring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-white">Mijoz ma'lumotlari</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white">Ismi</p>
                <p className="font-medium text-slate-400">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-white">Email</p>
                <p className="font-medium text-slate-400">{order.customerEmail}</p>
              </div>
            </div>
          </div>

          {/* Status Control */}
          <div className="bg-gray-800 border-t pt-4 justify-between">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Buyurtma statusi</h3>

              <Select
                value={order.status}
                onValueChange={(value) => handleStatusUpdate(value as OrderStatus)}
                disabled={savingStatus}
              >
                <SelectTrigger className={`text-sm px-3 py-1 ${statusColors[order.status]} w-64`}>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products */}
          <div className="rounded-lg">
            <h3 className="font-semibold text-white mb-4">Mahsulotlar</h3>
            <div className="space-y-3">
              {order.products.map((product) => (
                <div
                  key={product.id}
                  className="p-3 border border-gray-700 rounded space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-white">
                        Kategoriya: <span className="font-medium text-slate-400">{product.category}</span>
                      </p>
                      <p className="text-sm text-white mt-1">
                        Miqdor: <span className="font-medium text-slate-400">{product.quantity}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingPrices[product.id] !== undefined ? (
                        <>
                          <Input
                            type="number"
                            value={editingPrices[product.id]}
                            onChange={(e) =>
                              handlePriceChange(product.id, Number(e.target.value))
                            }
                            className="w-24 h-8"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSavePrice(product.id)}
                            disabled={savingProductId === product.id}
                            className="bg-green-600 hover:bg-green-700 h-8"
                          >
                            Saqlash
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-white">
                            {product.price.toLocaleString('uz-UZ')} so'm
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePriceChange(product.id, product.price)}
                            className="h-8 text-black"
                          >
                            O'zgartirish
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 w-full">
                    {onProductStatusChange && (
                      <div className="flex gap-2 w-full">
                        {(['bor', 'kutilmoqda', 'yo\'q'] as const).map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={product.status === status ? "default" : "outline"}
                            onClick={() => handleProductStatusUpdate(product.id, status)}
                            disabled={savingProductId === product.id}
                            className={`h-7 flex-1 text-xs ${product.status === status
                              ? productStatusSelectedColors[status]
                              : 'hover:bg-gray-700 text-black border-gray-600'
                              }`}
                          >
                            {productStatusLabels[status]}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="text-white p-4 rounded-lg flex justify-between items-center">
            <span className="text-lg font-semibold">Jami summa:</span>
            <span className="text-2xl font-bold">
              {order.totalAmount.toLocaleString('uz-UZ')} so'm
            </span>
          </div>

          {/* Timestamps */}
          <div className="text-sm text-white border-t pt-4 flex justify-between">
            <div>
              <p className="font-medium">Yaratilgan:</p>
              <p>{new Date(order.createdAt).toLocaleString('uz-UZ')}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">O'zgartirilgan:</p>
              <p>{new Date(order.updatedAt).toLocaleString('uz-UZ')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
