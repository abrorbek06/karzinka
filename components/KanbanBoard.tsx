'use client';

import { useEffect, useMemo, useState } from 'react';
import { Customer, Order, OrderStatus, PaymentType, Product, ProductStatus } from '@/types/orders';
import { KanbanColumn } from './KanbanColumn';
import { OrderDetail } from './OrderDetail';
import { createOrder, fetchCustomers, fetchMeta, fetchOrders, updateOrderProduct, updateOrderStatus } from '@/lib/api';
import { extractProductsFromFile } from '@/lib/pdfParser';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: 'Yangi', color: 'border-blue-500' },
  processing: { label: 'Tayyorlashda', color: 'border-yellow-500' },
  shipped: { label: "Jo'natildi", color: 'border-purple-500' },
  delivered: { label: 'Qabul qilindi', color: 'border-green-500' },
  cancelled: { label: 'Bekor qilindi', color: 'border-red-500' },
};

function isSameDay(date: Date, compareDate: Date) {
  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  );
}

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [pickupDate, setPickupDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [products, setProducts] = useState<Array<Partial<Product> & { status?: ProductStatus }>>([
    { name: '', quantity: 1, price: 0, category: '', status: 'bor' },
  ]);
  const { toast } = useToast();

  const statuses: OrderStatus[] = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];

  const ordersByStatus = useMemo(() => {
    return statuses.reduce(
      (acc, status) => {
        acc[status] = orders.filter((order) => order.status === status);
        return acc;
      },
      {} as Record<OrderStatus, Order[]>
    );
  }, [orders]);

  const todayOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => isSameDay(new Date(order.pickupDate), now));
  }, [orders]);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        const [ordersData, customersData, meta] = await Promise.all([
          fetchOrders(),
          fetchCustomers(),
          fetchMeta(),
        ]);
        if (active) {
          setOrders(ordersData);
          setCustomers(customersData);
          setAssignees(meta.assignees);
        }
      } catch (error) {
        if (active) {
          toast({
            title: 'Buyurtmalar yuklanmadi',
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

    loadOrders();

    return () => {
      active = false;
    };
  }, [toast]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const replaceOrder = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
    setSelectedOrder((prevSelectedOrder) =>
      prevSelectedOrder?.id === updatedOrder.id ? updatedOrder : prevSelectedOrder
    );
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: OrderStatus) => {
    e.preventDefault();
    if (!draggedOrderId) return;

    try {
      const updatedOrder = await updateOrderStatus(draggedOrderId, newStatus);
      replaceOrder(updatedOrder);
    } catch (error) {
      toast({
        title: 'Status saqlanmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    }

    setDraggedOrderId(null);
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

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: '', quantity: 1, price: 0, category: '', status: 'bor' }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: string, value: string | number) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    try {
      const extractedProducts = await extractProductsFromFile(file);
      if (extractedProducts.length > 0) {
        const newProducts = [
          ...products.filter(p => p.name),
          ...extractedProducts.map(p => ({ ...p, status: 'bor' as ProductStatus })),
        ];

        if (newProducts.length === 0) {
          setProducts(extractedProducts.map(p => ({ ...p, status: 'bor' as ProductStatus })));
        } else {
          setProducts(newProducts);
        }

        const fileType = file.name.split('.').pop()?.toUpperCase() || 'Fayl';
        toast({
          title: "Mahsulotlar qo'shildi",
          description: `${fileType} dan ${extractedProducts.length} ta mahsulot qo'shildi.`,
        });
      } else {
        toast({
          title: 'Mahsulot topilmadi',
          description: 'Fayl parsing qilishda muammo yuz berdi.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fayl parsing xatosi',
        description: error instanceof Error ? error.message : 'Fayl o\'qilmadi.',
        variant: 'destructive',
      });
    } finally {
      setFileLoading(false);
      e.target.value = '';
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setSubmitting(true);
    try {
      const newOrder = await createOrder({
        customerId: selectedCustomer,
        paymentType,
        pickupDate,
        assignedTo,
        products: products.map((product) => ({
          name: product.name || '',
          quantity: product.quantity || 1,
          price: product.price || 0,
          category: product.category || '',
          status: product.status || 'bor',
        })),
      });

      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      setSelectedCustomer('');
      setPaymentType('cash');
      setPickupDate('');
      setAssignedTo('');
      setProducts([{ name: '', quantity: 1, price: 0, category: '', status: 'bor' }]);
      setIsOpen(false);
      toast({
        title: 'Buyurtma yaratildi',
        description: `${newOrder.id} saqlandi.`,
      });
    } catch (error) {
      toast({
        title: 'Buyurtma yaratilmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full overflow-x-auto bg-gray-900 text-white p-6 relative">
      {loading ? (
        <div className="flex h-full items-center justify-center text-gray-400">
          Buyurtmalar yuklanmoqda...
        </div>
      ) : (
        <div className="flex gap-6 min-w-max h-full w-full">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {/* <DialogTrigger asChild>
              <div className="h-full flex items-stretch">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-12 flex items-center justify-center px-0 h-full rounded-r-lg"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  + Yangi Buyurtma
                </Button>
              </div>
            </DialogTrigger> */}
            <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl">Yangi Buyurtma Yaratish</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Buyurtma ma'lumotlarini to'liq to'ldiring
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mijoz</label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Mijozni tanlang" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id} className="text-white hover:bg-slate-600">
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">To'lov Turi</label>
                    <Select value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="cash" className="text-white hover:bg-slate-600">Naqd Pul</SelectItem>
                        <SelectItem value="card" className="text-white hover:bg-slate-600">Karta</SelectItem>
                        <SelectItem value="transfer" className="text-white hover:bg-slate-600">O'tkazma</SelectItem>
                        <SelectItem value="online" className="text-white hover:bg-slate-600">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Pickup Sanasi</label>
                    <Input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mas'ul Shaxs</label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Shaxsni tanlang" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {assignees.map((assignee) => (
                          <SelectItem key={assignee} value={assignee} className="text-white hover:bg-slate-600">
                            {assignee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>



                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mahsulotlar</label>
                  <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex gap-2 mb-3">
                      <Input
                        type="file"
                        accept=".pdf,.csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={fileLoading}
                        className="flex-1 bg-slate-600 border-slate-500 text-white placeholder-slate-500 cursor-pointer file:text-white file:border-0 file:rounded file:cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap pt-2">PDF, CSV, Excel</span>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {products.map((product, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <Input
                          placeholder="Mahsulot nomi"
                          value={product.name || ''}
                          onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                          className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                        <Input
                          type="number"
                          placeholder="Miqdor"
                          value={product.quantity || 1}
                          onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                          className="w-20 bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                        <Input
                          type="number"
                          placeholder="Narx"
                          value={product.price || 0}
                          onChange={(e) => handleProductChange(index, 'price', Number(e.target.value))}
                          className="w-24 bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveProduct(index)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          O'chirish
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddProduct}
                    className="mt-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    + Mahsulot
                  </Button>
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  {submitting ? 'Saqlanmoqda...' : 'Buyurtma Yaratish'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <KanbanColumn
            key="today"
            status="today"
            statusLabel="Bugun"
            orders={todayOrders}
            onOrderClick={handleOrderClick}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            colorClass="border-red-500"
            droppable={false}
            emptyLabel="Bugungi buyurtmalar yo'q"
          />
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              statusLabel={statusConfig[status].label}
              orders={ordersByStatus[status]}
              onOrderClick={handleOrderClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              colorClass={statusConfig[status].color}
              showAddButton={status === 'new'}
              onAddClick={() => setIsOpen(true)}
            />
          ))}
        </div>
      )}

      <OrderDetail
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        onProductPriceChange={handleProductPriceChange}
        onProductStatusChange={handleProductStatusChange}
        availableStatuses={statuses}
      />
    </div>
  );
}
