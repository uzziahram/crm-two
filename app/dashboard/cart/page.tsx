'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
  item_id: number;
  product_id: number;
  name: string;
  quantity: number;
  unit_price: string;
  image_url: string;
}

interface Cart {
  order_id: number;
  total_amount: string;
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD' | 'E-WALLET'>('CARD');
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'customer') {
      router.push('/');
      return;
    }

    fetchCart();
  }, [router]);

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/customers/cart/current', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(itemId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/customers/cart/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });

      if (res.ok) {
        await fetchCart();
        setMessage({ text: 'QUANTITY UPDATED', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'UPDATE FAILED', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'NETWORK ERROR', type: 'error' });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!confirm('REMOVE THIS INSTRUMENT FROM CART?')) return;
    setUpdatingId(itemId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/customers/cart/remove', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId }),
      });

      if (res.ok) {
        await fetchCart();
        setMessage({ text: 'ITEM REMOVED', type: 'success' });
      } else {
        setMessage({ text: 'REMOVAL FAILED', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'NETWORK ERROR', type: 'error' });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleCheckout = async () => {
    if (!cart || !shippingAddress) {
      setMessage({ text: 'SHIPPING ADDRESS REQUIRED', type: 'error' });
      return;
    }
    
    setCheckingOut(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`/api/v1/orders/${cart.order_id}/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          payment_method: paymentMethod,
          shipping_address: shippingAddress
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'ORDER PLACED SUCCESSFULLY', type: 'success' });
        setCart(null);
        setTimeout(() => router.push('/dashboard/orders'), 3000);
      } else {
        setMessage({ text: data.error || 'CHECKOUT FAILED', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'NETWORK ERROR', type: 'error' });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-mono transition-colors duration-300">
      {/* Feedback Message */}
      {message && (
        <div className={`fixed top-24 right-8 z-50 p-4 text-[10px] font-bold tracking-widest border border-l-4 shadow-xl animate-in slide-in-from-right duration-300 ${
          message.type === 'success' 
            ? 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 border-l-zinc-800 dark:border-l-zinc-200 text-zinc-800 dark:text-zinc-200' 
            : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 border-l-red-500 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-6 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div>
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">Customer Portal</h1>
          <h2 className="text-xl font-light text-zinc-600 dark:text-zinc-300 uppercase tracking-tight">Your Selection</h2>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/orders"
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
          >
            Archives
          </Link>
          <Link 
            href="/dashboard"
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 transition-all"
          >
            Catalog
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-300 animate-pulse">Loading Selection...</p>
          </div>
        ) : !cart || !cart.items || cart.items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-8">Empty selection</p>
            <Link 
              href="/dashboard"
              className="inline-block px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Browse Inventory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] overflow-x-auto backdrop-blur-sm">
                <table className="w-full text-left min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Product</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-center">Quantity</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-right">Total</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item) => (
                      <tr key={item.item_id} className={`border-b border-zinc-50 dark:border-zinc-800/30 transition-opacity ${updatingId === item.item_id ? 'opacity-50' : ''}`}>
                        <td className="p-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden p-2 shrink-0 aspect-square">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name} 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="text-[6px] font-bold text-zinc-200 uppercase">No Img</div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-light text-zinc-700 dark:text-zinc-200">{item.name}</p>
                              <p className="text-[10px] text-zinc-300 uppercase mt-1 tracking-tighter">Unit: ${parseFloat(item.unit_price).toLocaleString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-4">
                            <button 
                              onClick={() => handleUpdateQuantity(item.item_id, item.quantity - 1)}
                              disabled={updatingId !== null || item.quantity <= 1}
                              className="w-8 h-8 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold w-4 text-center text-zinc-600 dark:text-zinc-300">{item.quantity}</span>
                            <button 
                              onClick={() => handleUpdateQuantity(item.item_id, item.quantity + 1)}
                              disabled={updatingId !== null}
                              className="w-8 h-8 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-6 text-sm font-bold text-zinc-700 dark:text-zinc-100 text-right">
                          ${(parseFloat(item.unit_price) * item.quantity).toLocaleString()}
                        </td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleRemoveItem(item.item_id)}
                            disabled={updatingId !== null}
                            className="p-2 text-zinc-200 hover:text-red-400 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H5c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h8c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Payment & Checkout */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-6">Dispatch Details</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Target Address</label>
                    <textarea 
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full p-3 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all h-24 rounded-none resize-none placeholder:text-zinc-200 dark:placeholder:text-zinc-700"
                      placeholder="STREET, CITY, ZIP"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Transaction Mode</label>
                    <div className="space-y-2">
                      {[
                        { id: 'CARD', label: 'DEBIT / CREDIT' },
                        { id: 'E-WALLET', label: 'DIGITAL WALLET' },
                        { id: 'COD', label: 'CASH ON ARRIVAL' },
                      ].map((mode) => (
                        <label 
                          key={mode.id}
                          className={`flex items-center gap-3 p-4 border transition-all cursor-pointer ${
                            paymentMethod === mode.id 
                              ? 'border-zinc-300 dark:border-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/50' 
                              : 'border-zinc-50 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700'
                          }`}
                        >
                          <input 
                            type="radio"
                            name="payment"
                            className="hidden"
                            checked={paymentMethod === mode.id}
                            onChange={() => setPaymentMethod(mode.id as any)}
                          />
                          <div className={`w-2.5 h-2.5 border border-zinc-300 dark:border-zinc-600 ${paymentMethod === mode.id ? 'bg-zinc-600 dark:bg-zinc-300 border-zinc-600 dark:border-zinc-300' : ''}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{mode.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Total Value</p>
                    <p className="text-2xl font-light text-zinc-700 dark:text-zinc-200">${parseFloat(cart.total_amount).toLocaleString()}</p>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={checkingOut || updatingId !== null}
                    className="w-full py-5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all shadow-sm active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                  >
                    {checkingOut ? 'WAIT...' : 'Confirm Transaction'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
