'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  product_id: number;
  name: string;
  image_url: string;
  quantity: number;
  unit_price: string;
  is_reviewed: boolean;
}

interface Order {
  order_id: number;
  total_amount: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingItem, setReviewingItem] = useState<{ orderId: number, product: OrderItem } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'customer') {
      router.push('/');
      return;
    }

    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/customers/orders/detailed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;

    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/customers/reviews/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: reviewingItem.orderId,
          productId: reviewingItem.product.product_id,
          rating,
          comment
        }),
      });

      if (res.ok) {
        setMessage({ text: 'REVIEW SUBMITTED SUCCESSFULLY', type: 'success' });
        setReviewingItem(null);
        setComment('');
        setRating(5);
        fetchOrders();
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'SUBMISSION FAILED', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'NETWORK ERROR', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
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

      {/* Review Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-background border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setReviewingItem(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="p-10">
              <div className="mb-8">
                <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-zinc-400 mb-2">Product Review</h2>
                <h1 className="text-xl font-light text-zinc-700 dark:text-zinc-200 uppercase tracking-tight line-clamp-1">{reviewingItem.product.name}</h1>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Satisfaction Level</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`transition-all ${rating >= star ? 'text-zinc-800 dark:text-zinc-200 scale-110' : 'text-zinc-200 dark:text-zinc-800'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={rating >= star ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Feedback Terminal</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-4 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all h-32 rounded-none resize-none placeholder:text-zinc-200 dark:placeholder:text-zinc-700"
                    placeholder="ENTER PRODUCT FEEDBACK..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'TRANSMITTING...' : 'Submit Evaluation'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-6 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div>
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">Customer Portal</h1>
          <h2 className="text-xl font-light text-zinc-600 dark:text-zinc-300 uppercase tracking-tight">Archives</h2>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/cart"
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
          >
            Cart
          </Link>
          <Link 
            href="/dashboard"
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 transition-all"
          >
            Catalog
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-300 animate-pulse">Scanning Archives...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">No historical data</p>
            <Link 
              href="/dashboard"
              className="inline-block px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Initialize Purchase
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm space-y-8">
                <div className="flex flex-wrap justify-between items-start gap-6 border-b border-zinc-50 dark:border-zinc-800/50 pb-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-1">Index ID</p>
                      <p className="text-lg font-light text-zinc-700 dark:text-zinc-100">#TRX-{order.order_id.toString().padStart(6, '0')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-1">Timestamp</p>
                      <p className="text-xs font-light text-zinc-500 dark:text-zinc-400 uppercase">{new Date(order.created_at).toLocaleDateString()} // {new Date(order.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Process</p>
                      <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-tighter ${
                        order.order_status === 'DELIVERED' 
                        ? 'border-green-100 dark:border-green-900/20 text-green-500' 
                        : 'border-zinc-100 dark:border-zinc-800 text-zinc-400'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Verification</p>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter border ${
                        order.payment_status === 'PAID' 
                        ? 'border-green-100 dark:border-green-900/20 text-green-500' 
                        : 'border-zinc-100 dark:border-zinc-800 text-zinc-400'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-1">Net Value</p>
                      <p className="text-xl font-light text-zinc-700 dark:text-zinc-200">${parseFloat(order.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="space-y-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Consolidated Hardware</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-6 p-4 border border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-900/20 transition-all hover:bg-white dark:hover:bg-zinc-800/40">
                        <div className="w-16 h-16 bg-white border border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-2 overflow-hidden shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-[8px] font-bold text-zinc-200 uppercase">No Img</div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-zinc-400 uppercase mt-1">QTY: {item.quantity} // ${parseFloat(item.unit_price).toLocaleString()}</p>
                        </div>
                        {order.order_status === 'DELIVERED' && (
                          <div className="shrink-0">
                            {item.is_reviewed ? (
                              <span className="text-[9px] font-bold text-zinc-300 uppercase border border-zinc-100 dark:border-zinc-800 px-2 py-1">Evaluated</span>
                            ) : (
                              <button
                                onClick={() => setReviewingItem({ orderId: order.order_id, product: item })}
                                className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200 uppercase border border-zinc-200 dark:border-zinc-800 px-3 py-1 hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:text-white dark:hover:text-zinc-900 transition-all shadow-sm"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Decoration */}
      <footer className="mt-12 py-12 border-t border-zinc-100 dark:border-zinc-900 text-center opacity-40">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-zinc-400">
          Order Archives v1.1.0 // Tech Forge Secure System
        </p>
      </footer>
    </div>
  );
}
