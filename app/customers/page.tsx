'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Customer } from '@/types/orders';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createCustomer, deleteCustomer, fetchCustomers } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const loadCustomers = async () => {
      try {
        const data = await fetchCustomers();
        if (active) {
          setCustomers(data);
        }
      } catch (error) {
        if (active) {
          toast({
            title: 'Mijozlar yuklanmadi',
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

    loadCustomers();

    return () => {
      active = false;
    };
  }, [toast]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const newCustomer = await createCustomer(formData);
      setCustomers((prevCustomers) => [newCustomer, ...prevCustomers]);
      setFormData({ name: '', email: '', phone: '', address: '' });
      setIsOpen(false);
      toast({
        title: 'Mijoz qo‘shildi',
        description: newCustomer.name,
      });
    } catch (error) {
      toast({
        title: 'Mijoz qo‘shilmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCustomer(id);
      setCustomers((prevCustomers) => prevCustomers.filter((customer) => customer.id !== id));
      toast({
        title: 'Mijoz o‘chirildi',
      });
    } catch (error) {
      toast({
        title: 'Mijoz o‘chirilmadi',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Mijozlar</h1>
            <p className="text-slate-400">Jami mijozlar: <span className="font-semibold text-blue-400">{customers.length}</span></p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                + Yangi Mijoz
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl">Yangi Mijoz Qo'shish</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Mijoz ma'lumotlarini to'liq kiriting
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <Input
                  placeholder="To'liq ism"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
                <Input
                  placeholder="Telefon raqami"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
                <Input
                  placeholder="Manzil"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  {submitting ? 'Saqlanmoqda...' : "Qo'shish"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">
            Mijozlar yuklanmoqda...
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCustomer(customer.id)}
                  disabled={deletingId === customer.id}
                  className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                >
                  {deletingId === customer.id ? 'Kutilmoqda...' : "O'chirish"}
                </Button>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{customer.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-300 font-mono text-xs">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Telefon:</span>
                  <span className="text-slate-300 font-mono text-xs">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500">Manzil:</span>
                  <span className="text-slate-300 text-xs">{customer.address}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  Qo'shilgan: {customer.createdAt.toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </main>
  );
}
