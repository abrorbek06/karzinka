'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Customer, Order, OrderStatus, PaymentType, Product, ProductStatus } from '@/types/orders';
import { fetchCustomers, fetchMeta, fetchOrders, updateOrderProduct, updateOrderStatus } from '@/lib/api';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { OrderDetail } from '@/components/OrderDetail';

const statusLabels: Record<OrderStatus, string> = {
  new: 'Yangi',
  processing: 'Tayyorlashda',
  shipped: "Jo'natildi",
  delivered: 'Qabul qilindi',
  cancelled: 'Bekor qilindi',
};

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const availableStatuses: OrderStatus[] = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [ordersData, customersData, meta] = await Promise.all([
          fetchOrders(),
          fetchCustomers(),
          fetchMeta(),
        ]);

        if (!active) return;

        setOrders(ordersData);
        setCustomers(customersData);
        setAssignees(meta.assignees);
      } catch (error) {
        if (active) {
          toast({
            title: 'Ma’lumotlar yuklanmadi',
            description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
            variant: 'destructive',
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [toast]);

  const replaceOrder = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
    setSelectedOrder((prevSelectedOrder) =>
      prevSelectedOrder?.id === updatedOrder.id ? updatedOrder : prevSelectedOrder
    );
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      replaceOrder(updatedOrder);
    } catch (error) {
      toast({
        title: 'Status saqlanmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    }
  };

  const handleProductPriceChange = async (orderId: string, productId: string, newPrice: number) => {
    try {
      const updatedOrder = await updateOrderProduct(orderId, productId, { price: newPrice });
      replaceOrder(updatedOrder);
    } catch (error) {
      toast({
        title: 'Mahsulot narxi saqlanmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    }
  };

  const handleProductStatusChange = async (orderId: string, productId: string, newStatus: ProductStatus) => {
    try {
      const updatedOrder = await updateOrderProduct(orderId, productId, { status: newStatus });
      replaceOrder(updatedOrder);
    } catch (error) {
      toast({
        title: 'Mahsulot statusi saqlanmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Buyurtmani o\'chirib tashlamoqchi musiz?')) return;

    try {
      await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setDetailOpen(false);
      }
      toast({
        style: { backgroundColor: '#52995f', color: '#fff' },
        title: 'Buyurtma o\'chirildi',
        description: `${orderId} o'chirildi.`,
      });
    } catch (error) {
      toast({
        title: 'Buyurtma o\'chirilmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <div className="p-8 max-w-8xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Buyurtmalar</h1>
            <p className="text-slate-400">Jami buyurtmalar: <span className="font-semibold text-blue-400">{orders.length}</span></p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => exportToCSV(orders, `buyurtmalar-${new Date().toISOString().split('T')[0]}.csv`)}
              variant="outline"
              className="text-sm border-slate-600 text-black-300 hover:bg-slate-700 hover:text-white"
            >
              📊 CSV
            </Button>
            <Button
              onClick={() => exportToExcel(orders, `buyurtmalar-${new Date().toISOString().split('T')[0]}.xlsx`)}
              variant="outline"
              className="text-sm border-slate-600 text-black-300 hover:bg-slate-700 hover:text-white"
            >
              📈 Excel
            </Button>
            <Button
              onClick={() => exportToPDF(orders, `buyurtmalar-${new Date().toISOString().split('T')[0]}.pdf`)}
              variant="outline"
              className="text-sm border-slate-600 text-black-300 hover:bg-slate-700 hover:text-white"
            >
              📄 PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">
            Buyurtmalar yuklanmoqda...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800">
                  <TableHead className="px-4 py-3 text-slate-300">ID</TableHead>
                  <TableHead className="px-4 py-3 text-slate-300">Mijoz</TableHead>
                  <TableHead className="px-4 py-3 text-slate-300">Status</TableHead>
                  <TableHead className="px-4 py-3 text-slate-300">Mahsulot</TableHead>
                  <TableHead className="px-4 py-3 text-slate-300">To'lov</TableHead>
                  <TableHead className="px-4 py-3 text-slate-300">Pickup</TableHead>
                  <TableHead className="px-4 py-3 text-slate-300">Mas'ul</TableHead>
                  <TableHead className="px-4 py-3 text-right text-slate-300">Jami</TableHead>
                  <TableHead className="px-4 py-3 text-right text-slate-300">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className="cursor-pointer border-slate-700 text-slate-200 hover:bg-slate-700/60"
                  >
                    <TableCell className="px-4 py-4 font-medium text-white">{order.id}</TableCell>
                    <TableCell className="px-4 py-4">
                      <div>
                        <p className="font-medium text-white">{order.customerName}</p>
                        <p className="text-xs text-slate-400">{order.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div>
                        <p>{order.products.length} ta mahsulot</p>
                        <p className="text-xs text-slate-400">{order.products[0]?.name ?? '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-slate-300">
                      {order.paymentType === 'cash'
                        ? 'Naqd'
                        : order.paymentType === 'card'
                          ? 'Karta'
                          : order.paymentType === 'transfer'
                            ? "O'tkazma"
                            : 'Online'}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-slate-300">
                      {order.pickupDate.toLocaleDateString('uz-UZ')}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-slate-300">
                      {order.assignedTo || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <span className="font-semibold text-emerald-400">
                        {order.totalAmount.toLocaleString('uz-UZ')} so'm
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-4 text-right">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                        variant="destructive"
                        size="sm"
                        className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700"
                      >
                        O'chirish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <OrderDetail
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        onProductPriceChange={handleProductPriceChange}
        onProductStatusChange={handleProductStatusChange}
        availableStatuses={availableStatuses}
      />
    </main>
  );
}
