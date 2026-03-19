'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Customer, Order, OrderStatus } from '@/types/orders';
import { fetchCustomers, fetchOrders } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

export default function StatisticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [ordersData, customersData] = await Promise.all([
          fetchOrders(),
          fetchCustomers(),
        ]);

        if (active) {
          setOrders(ordersData);
          setCustomers(customersData);
        }
      } catch (error) {
        if (active) {
          toast({
            title: 'Statistika yuklanmadi',
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

  // Calculate statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Orders by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<OrderStatus, number>);

  // Payment type distribution
  const paymentCounts = orders.reduce((acc, order) => {
    acc[order.paymentType] = (acc[order.paymentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Revenue by status
  const revenueByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<OrderStatus, number>);

  // Top customers
  const customerRevenue = orders.reduce((acc, order) => {
    const existing = acc.find((c) => c.name === order.customerName);
    if (existing) {
      existing.revenue += order.totalAmount;
      existing.orders += 1;
    } else {
      acc.push({ name: order.customerName, revenue: order.totalAmount, orders: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; revenue: number; orders: number }>);

  customerRevenue.sort((a, b) => b.revenue - a.revenue);
  const topCustomers = customerRevenue.slice(0, 5);

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    count,
    revenue: revenueByStatus[status as OrderStatus],
  }));

  const paymentChartData = Object.entries(paymentCounts).map(([type, count]) => ({
    name: type === 'cash' ? 'Naqd pul' : type === 'card' ? 'Karta' : type === 'transfer' ? 'O\'tkazma' : 'Online',
    value: count,
  }));

  const statusLabels: Record<string, string> = {
    new: 'Yangi',
    processing: 'Tayyorlashda',
    shipped: "Jo'natildi",
    delivered: 'Qabul qilindi',
    cancelled: 'Bekor qilindi',
  };

  const COLORS = ['#3b82f6', '#f59e0b', '#a855f7', '#10b981', '#ef4444'];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Statistika</h1>
          <p className="text-slate-400">Sizning biznesingizning to'liq ko'rinishi</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Jami Buyurtmalar</p>
            <p className="text-4xl font-bold mt-3">{totalOrders}</p>
            <div className="mt-4 h-1 bg-blue-500 rounded-full w-12"></div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">Jami Daromad</p>
            <p className="text-4xl font-bold mt-3">
              {(totalRevenue / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-emerald-200 mt-1 font-mono">
              {totalRevenue.toLocaleString('uz-UZ')} so'm
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">O'rta Buyurtma</p>
            <p className="text-4xl font-bold mt-3">
              {(averageOrderValue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-purple-200 mt-1 font-mono">
              {Math.round(averageOrderValue).toLocaleString('uz-UZ')} so'm
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">Jami Mijozlar</p>
            <p className="text-4xl font-bold mt-3">{customers.length}</p>
            <div className="mt-4 h-1 bg-orange-500 rounded-full w-12"></div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">
            Statistika yuklanmoqda...
          </div>
        ) : (
          <>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Orders by Status */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Buyurtmalar Statusiga Ko'ra</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Types */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">To'lov Turlariga Ko'ra</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Status */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Daromad Statusiga Ko'ra</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-6">Top 5 Mijozlar</h2>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-600">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{customer.name}</p>
                    <p className="text-sm text-slate-400">{customer.orders} buyurtma</p>
                  </div>
                </div>
                <p className="font-semibold text-emerald-400 font-mono">
                  {customer.revenue.toLocaleString('uz-UZ')} so'm
                </p>
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>
    </main>
  );
}
