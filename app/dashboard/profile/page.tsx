'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  item_id: number;
  product_id: number;
  name: string;
  quantity: number;
  unit_price: string;
  image_url: string;
}

interface Order {
  order_id: number;
  total_amount: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: string;
  created_at: string;
  items?: OrderItem[];
}

interface UserProfile {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'customer') {
      router.push('/');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [profileRes, ordersRes] = await Promise.all([
        fetch('/api/v1/customers/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/v1/customers/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-mono flex items-center justify-center">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-300 animate-pulse">Retrieving Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-6 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div>
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">Identity Hub</h1>
          <h2 className="text-xl font-light text-zinc-600 dark:text-zinc-300 uppercase tracking-tight">Personal Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 transition-all"
          >
            Catalog
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-all"
          >
            Terminal Shutdown
          </button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-12">
        {/* User Info Section */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm">
          <div className="flex items-start gap-10">
            <div className="w-24 h-24 bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center text-3xl text-white dark:text-zinc-800 shrink-0">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8 flex-grow">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Full Designation</p>
                <p className="text-xl font-light text-zinc-700 dark:text-zinc-200 uppercase">{profile?.first_name} {profile?.last_name}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Network Address</p>
                <p className="text-xl font-light text-zinc-700 dark:text-zinc-200">{profile?.email}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Activation Date</p>
                <p className="text-sm font-light text-zinc-500 dark:text-zinc-400 uppercase">
                  {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">System ID</p>
                <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">USER-{profile?.customer_id.toString().padStart(5, '0')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Orders Section */}
        <section className="space-y-6">
          <div className="flex items-end gap-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Transaction History</h3>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-grow mb-1.5" />
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">No transactions recorded</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.order_id} className="bg-white dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800 p-8 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
                  <div className="flex flex-wrap justify-between items-start gap-8 mb-8">
                    <div className="flex gap-10">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Order Ref</p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">#ORD-{order.order_id}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Timestamp</p>
                        <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Value</p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">${parseFloat(order.total_amount).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${
                        order.order_status === 'DELIVERED' 
                          ? 'border-green-100 text-green-500 bg-green-50/10' 
                          : 'border-zinc-100 dark:border-zinc-800 text-zinc-400'
                      }`}>
                        {order.order_status}
                      </span>
                      <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${
                        order.payment_status === 'PAID' 
                          ? 'border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300' 
                          : 'border-yellow-100 text-yellow-500 bg-yellow-50/10'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-zinc-50 dark:border-zinc-800/50 pt-6">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Destination</p>
                    <p className="text-xs font-light text-zinc-500 dark:text-zinc-400 uppercase max-w-md">{order.shipping_address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
