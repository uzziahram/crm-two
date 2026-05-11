'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Analytics {
  total_revenue: number;
  total_orders_delivered: number;
}

interface Product {
  product_id: number;
  name: string;
  stock_quantity: number;
  price: string;
  is_visible: boolean;
}

interface MonthlyProfit {
  month: string;
  total_income: string;
  total_investment: string;
  net_profit: string;
}

interface OrderProfitDetail {
  order_id: number;
  created_at: string;
  total_income: string;
  total_investment: string;
  net_profit: string;
  first_name: string;
  last_name: string;
}

interface AdminOrder {
  order_id: number;
  customer_id: number;
  total_amount: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AdminReview {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
  product_name: string;
  product_id: number;
  first_name: string;
  last_name: string;
  email: string;
  order_id: number;
}

interface AdminCustomer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  total_orders: number;
  total_spent: string;
}

interface CustomerActivity {
  items: Array<{
    product_id: number;
    name: string;
    image_url: string;
    unit_price: string;
    purchase_date: string;
    order_id: number;
  }>;
  reviews: Array<{
    review_id: number;
    rating: number;
    comment: string;
    created_at: string;
    product_name: string;
    order_id: number;
  }>;
}

type Tab = 'INVENTORY' | 'PROFITS' | 'ORDERS' | 'SATISFACTION' | 'CUSTOMERS';
type OrderStatusFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('INVENTORY');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [profits, setProfits] = useState<MonthlyProfit[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [ratingSummary, setRatingSummary] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthlyDetails, setMonthlyDetails] = useState<OrderProfitDetail[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [customerActivity, setCustomerActivity] = useState<CustomerActivity | null>(null);
  
  const [orderFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('ALL');
  
  // Search States
  const [searchQueries, setSearchQueries] = useState<Record<Tab, string>>({
    INVENTORY: '',
    PROFITS: '',
    ORDERS: '',
    SATISFACTION: '',
    CUSTOMERS: ''
  });

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', specifications: '', price: '', cost_price: '', stock_quantity: '' });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [router, activeTab, searchQueries, selectedMonth]); // Refetch on tab/search change

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      // 1. Always fetch analytics for KPIs
      const analyticsRes = await fetch('/api/v1/admin/analytics', { headers });
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());

      // 2. Fetch specific tab data based on active tab and search query
      const query = searchQueries[activeTab];
      
      if (activeTab === 'INVENTORY') {
        const res = await fetch(`/api/v1/products?query=${query}`, { headers });
        if (res.ok) setProducts(await res.json());
      } else if (activeTab === 'ORDERS') {
        const res = await fetch(`/api/v1/admin/orders?query=${query}`, { headers });
        if (res.ok) setOrders(await res.json());
      } else if (activeTab === 'PROFITS') {
        if (selectedMonth) {
          const res = await fetch(`/api/v1/admin/profits?month=${selectedMonth}&query=${query}`, { headers });
          if (res.ok) setMonthlyDetails(await res.json());
        } else {
          const res = await fetch(`/api/v1/admin/profits?query=${query}`, { headers });
          if (res.ok) setProfits(await res.json());
        }
      } else if (activeTab === 'SATISFACTION') {
        const res = await fetch(`/api/v1/admin/reviews?query=${query}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews);
          setRatingSummary(data.summary);
        }
      } else if (activeTab === 'CUSTOMERS') {
        const res = await fetch(`/api/v1/admin/customers?query=${query}`, { headers });
        if (res.ok) setCustomers(await res.json());
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSearch = (val: string) => {
    setSearchQueries(prev => ({ ...prev, [activeTab]: val }));
  };

  const fetchMonthlyDetails = async (month: string) => {
    setDetailLoading(true);
    const token = localStorage.getItem('token');
    try {
      const query = searchQueries['PROFITS'];
      const res = await fetch(`/api/v1/admin/profits?month=${month}&query=${query}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        setMonthlyDetails(await res.json());
        setSelectedMonth(month);
      }
    } catch (error) {
      console.error('Error fetching monthly details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    Object.entries(newProduct).forEach(([k, v]) => formData.append(k, v));
    if (productImage) formData.append('image', productImage);

    try {
      const res = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setIsAddingProduct(false);
        setNewProduct({ name: '', description: '', specifications: '', price: '', cost_price: '', stock_quantity: '' });
        setProductImage(null);
        fetchData();
      }
    } catch (error) { console.error('Error creating product:', error); } finally { setIsCreating(false); }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.order_id === orderId ? { ...o, order_status: newStatus } : o));
        fetchData();
      }
    } catch (error) { console.error('Error updating status:', error); } finally { setUpdatingOrderId(null); }
  };

  const handleUpdateStock = async (productId: number) => {
    if (tempQuantity === '') { setEditingProductId(null); return; }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity: tempQuantity }),
      });
      if (res.ok) setProducts(products.map(p => p.product_id === productId ? { ...p, stock_quantity: parseInt(tempQuantity) } : p));
    } catch (error) { console.error('Error updating stock:', error); } finally { setEditingProductId(null); }
  };

  const handleToggleVisibility = async (productId: number, currentVisibility: boolean) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isVisible: !currentVisibility }),
      });
      if (res.ok) setProducts(products.map(p => p.product_id === productId ? { ...p, is_visible: !currentVisibility } : p));
    } catch (error) { console.error('Error updating visibility:', error); }
  };

  const fetchCustomerActivity = async (customer: AdminCustomer) => {
    setDetailLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/admin/customers/${customer.customer_id}/activity`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setCustomerActivity(await res.json()); setSelectedCustomer(customer); }
    } catch (error) { console.error('Error fetching customer activity:', error); } finally { setDetailLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/admin/login');
  };

  const filteredOrders = orderFilter === 'ALL' ? orders : orders.filter(o => o.order_status === orderFilter);

  return (
    <div className="min-h-screen bg-background font-mono transition-colors duration-300">
      {/* Add Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-background border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden max-h-[90vh]">
            <button onClick={() => setIsAddingProduct(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors z-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="p-10 overflow-y-auto max-h-[90vh]">
              <div className="mb-10">
                <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-zinc-400 mb-2">Inventory Management</h2>
                <h1 className="text-2xl font-light text-zinc-700 dark:text-zinc-200 uppercase tracking-tight">Register New Hardware</h1>
              </div>
              <form onSubmit={handleCreateProduct} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Product Name</label><input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all" placeholder="E.G. QUANTUM PROCESSOR X1" /></div>
                  <div className="space-y-2"><label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Initial Stock</label><input required type="number" value={newProduct.stock_quantity} onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all" placeholder="0" /></div>
                </div>
                <div className="space-y-2"><label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Overview / Description</label><textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all h-24 resize-none" placeholder="TECHNICAL OVERVIEW..." /></div>
                <div className="space-y-2"><label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Technical Specifications</label><input type="text" value={newProduct.specifications} onChange={(e) => setNewProduct({...newProduct, specifications: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all" placeholder="CPU: X1, RAM: 16GB" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400">MSRP</label><input required type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all" placeholder="0.00" /></div>
                  <div className="space-y-2"><label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400">COGS</label><input required type="number" step="0.01" value={newProduct.cost_price} onChange={(e) => setNewProduct({...newProduct, cost_price: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all" placeholder="0.00" /></div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Visual Hardware Identification</label>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-zinc-100 dark:border-zinc-800 p-8 text-center cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-all bg-zinc-50/20 dark:bg-zinc-900/20">
                    {productImage ? (
                      <div className="flex flex-col items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">{productImage.name}</p></div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p className="text-[10px] font-bold uppercase tracking-widest">Select Product Schematic (Image)</p></div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProductImage(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <button type="submit" disabled={isCreating} className="w-full py-5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all shadow-sm active:translate-y-[1px] active:translate-x-[1px] disabled:opacity-50">{isCreating ? 'UPLOADING TO SYSTEM...' : 'Finalize Registration'}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-6 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div>
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">Administrative</h1>
          <h2 className="text-xl font-light text-zinc-600 dark:text-zinc-300 uppercase tracking-tight">Executive Dashboard</h2>
        </div>
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-6 border-r border-zinc-100 dark:border-zinc-800 pr-8 mr-2">
            {[
              { id: 'INVENTORY', label: 'Inventory' },
              { id: 'ORDERS', label: 'Orders' },
              { id: 'PROFITS', label: 'Financials' },
              { id: 'SATISFACTION', label: 'Satisfaction' },
              { id: 'CUSTOMERS', label: 'Customers' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as Tab); setSelectedMonth(null); setSelectedCustomer(null); }}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab.id ? 'text-zinc-800 dark:text-zinc-100 border-b-2 border-zinc-800 dark:border-zinc-100 pb-1' : 'text-zinc-300 hover:text-zinc-500'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 transition-all">Terminal Logout</button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-12">
        {!loading && (
          <>
            {/* KPI Section */}
            {!selectedMonth && !selectedCustomer && (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Aggregate Revenue</p>
                  <p className="text-2xl font-light text-zinc-700 dark:text-zinc-200">${analytics?.total_revenue.toLocaleString() || '0.00'}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Orders Fulfilled</p>
                  <p className="text-2xl font-light text-zinc-700 dark:text-zinc-200">{analytics?.total_orders_delivered || 0}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Active SKUs</p>
                  <p className="text-2xl font-light text-zinc-700 dark:text-zinc-200">{products.length}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Average Rating</p>
                  <p className="text-2xl font-light text-zinc-700 dark:text-zinc-200">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'N/A'}</p>
                </div>
              </section>
            )}

            {/* Universal Search Console */}
            <section className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm flex items-center gap-6">
              <div className="flex-grow relative">
                <input 
                  type="text"
                  value={searchQueries[activeTab]}
                  onChange={(e) => updateSearch(e.target.value)}
                  placeholder={`SURGICAL SEARCH IN ${activeTab}...`}
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 p-2 pl-8 text-xs font-bold uppercase tracking-widest outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              {searchQueries[activeTab] && (
                <button onClick={() => updateSearch('')} className="text-[9px] font-bold uppercase text-zinc-300 hover:text-red-400 transition-colors">Reset [X]</button>
              )}
            </section>

            {activeTab === 'INVENTORY' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-8 border-b border-zinc-50 dark:border-zinc-900 pb-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory Status</h3>
                  <button onClick={() => setIsAddingProduct(true)} className="px-6 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest">+ Add Product</button>
                </div>
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] overflow-x-auto backdrop-blur-sm">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Identity</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Product Name</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-right">Unit Price</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-center">Stock</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Visibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.product_id} className="border-b border-zinc-50 dark:border-zinc-800/30">
                          <td className="p-6 text-[11px] font-bold text-zinc-400">STK-{product.product_id}</td>
                          <td className="p-6 text-sm font-light text-zinc-700 dark:text-zinc-200 uppercase">{product.name}</td>
                          <td className="p-6 text-sm font-light text-zinc-500 dark:text-zinc-400 text-right">${parseFloat(product.price).toLocaleString()}</td>
                          <td className="p-6 text-sm font-bold text-zinc-600 dark:text-zinc-300 text-center">
                            {editingProductId === product.product_id ? (
                              <input type="number" autoFocus value={tempQuantity} onChange={(e) => setTempQuantity(e.target.value)} onBlur={() => handleUpdateStock(product.product_id)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(product.product_id)} className="w-16 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1" />
                            ) : (
                              <div onClick={() => { setEditingProductId(product.product_id); setTempQuantity(product.stock_quantity.toString()); }} className="cursor-pointer">{product.stock_quantity}</div>
                            )}
                          </td>
                          <td className="p-6">
                            <button onClick={() => handleToggleVisibility(product.product_id, product.is_visible)} className={`text-[9px] font-bold uppercase px-3 py-1 border ${product.is_visible ? 'border-zinc-800 dark:border-zinc-200 text-zinc-800 dark:text-zinc-200' : 'text-zinc-300'}`}>{product.is_visible ? 'Visible' : 'Hidden'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'ORDERS' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-8 border-b border-zinc-50 dark:border-zinc-900 pb-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Dispatch Control</h3>
                  <div className="flex gap-2">
                    {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                      <button key={status} onClick={() => setOrderStatusFilter(status as any)} className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 border transition-all ${orderFilter === status ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900' : 'text-zinc-300'}`}>{status}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 overflow-x-auto backdrop-blur-sm">
                  <table className="w-full text-left min-w-[900px]">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Ref</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Purchaser</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-right">Value</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.order_id} className={`border-b border-zinc-50 dark:border-zinc-800/30 group transition-opacity ${updatingOrderId === order.order_id ? 'opacity-50' : ''}`}>
                          <td className="p-6 text-[11px] font-bold text-zinc-400">#ORD-{order.order_id}</td>
                          <td className="p-6"><p className="text-sm font-light text-zinc-700 dark:text-zinc-200 uppercase">{order.first_name} {order.last_name}</p><p className="text-[9px] text-zinc-300 font-bold uppercase mt-1">{order.email}</p></td>
                          <td className="p-6 text-sm font-bold text-zinc-700 dark:text-zinc-200 text-right">${parseFloat(order.total_amount).toLocaleString()}</td>
                          <td className="p-6">
                            <select value={order.order_status} onChange={(e) => handleUpdateStatus(order.order_id, e.target.value)} className="bg-transparent text-[9px] font-bold uppercase border p-1">
                              {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'PROFITS' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {!selectedMonth ? (
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 shadow-sm overflow-x-auto backdrop-blur-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                          <th className="p-6 text-[10px] font-bold uppercase text-zinc-300">Billing Period</th>
                          <th className="p-6 text-[10px] font-bold uppercase text-zinc-300 text-right">Revenue</th>
                          <th className="p-6 text-[10px] font-bold uppercase text-zinc-300 text-right">Investment</th>
                          <th className="p-6 text-[10px] font-bold uppercase text-zinc-300 text-right">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profits.map((record, index) => (
                          <tr key={index} className="border-b border-zinc-50 dark:border-zinc-800/30 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50" onClick={() => fetchMonthlyDetails(record.month)}>
                            <td className="p-6 text-[11px] font-bold text-zinc-400 uppercase">{record.month}</td>
                            <td className="p-6 text-sm font-light text-zinc-700 dark:text-zinc-200 text-right">${parseFloat(record.total_income).toLocaleString()}</td>
                            <td className="p-6 text-sm font-light text-zinc-500 dark:text-zinc-400 text-right">${parseFloat(record.total_investment).toLocaleString()}</td>
                            <td className="p-6 text-sm font-bold text-zinc-800 dark:text-zinc-100 text-right">${parseFloat(record.net_profit).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-6">
                      <button onClick={() => setSelectedMonth(null)} className="p-3 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      <h2 className="text-xl font-light text-zinc-700 dark:text-zinc-200 uppercase tracking-tight">{selectedMonth} Analysis</h2>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 shadow-sm overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            <th className="p-6 text-[10px] font-bold uppercase text-zinc-300">Transaction ID</th>
                            <th className="p-6 text-[10px] font-bold uppercase text-zinc-300">Purchaser</th>
                            <th className="p-6 text-[10px] font-bold uppercase text-zinc-300 text-right">Investment</th>
                            <th className="p-6 text-[10px] font-bold uppercase text-zinc-300 text-right">Net Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyDetails.map((order) => (
                            <tr key={order.order_id} className="border-b border-zinc-50 dark:border-zinc-800/30">
                              <td className="p-6 text-[11px] font-bold text-zinc-400 uppercase">#ORD-{order.order_id}</td>
                              <td className="p-6 text-sm font-light text-zinc-700 dark:text-zinc-200 uppercase">{order.first_name} {order.last_name}</td>
                              <td className="p-6 text-sm font-light text-zinc-500 dark:text-zinc-400 text-right">${parseFloat(order.total_investment).toLocaleString()}</td>
                              <td className="p-6 text-sm font-bold text-zinc-800 dark:text-zinc-100 text-right">${parseFloat(order.net_profit).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'SATISFACTION' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-10 shadow-sm backdrop-blur-sm flex justify-between items-center">
                  <div className="space-y-2"><h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Rating Distribution</h3><p className="text-3xl font-light text-zinc-700 dark:text-zinc-200">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}</p></div>
                  <div className="flex-grow max-w-sm grid grid-cols-1 gap-2">
                    {[5, 4, 3, 2, 1].map((star) => <div key={star} className="flex items-center gap-3"><span className="text-[9px] font-bold text-zinc-400 w-10">{star} STAR</span><div className="flex-grow h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full bg-zinc-800 dark:bg-zinc-200" style={{ width: `${reviews.length > 0 ? (ratingSummary[star] / reviews.length) * 100 : 0}%` }} /></div></div>)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => (
                    <div key={review.review_id} className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-sm">
                      <div className="flex justify-between items-start mb-4"><div><p className="text-[9px] font-bold text-zinc-300 uppercase mb-1">Hardware</p><p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 uppercase">{review.product_name}</p></div><span className="text-[10px] font-bold uppercase text-zinc-800 dark:text-zinc-200">{review.rating} STARS</span></div>
                      <div className="bg-zinc-50/50 dark:bg-zinc-800/30 p-4 border mb-4"><p className="text-xs font-light text-zinc-500 dark:text-zinc-400 leading-relaxed italic">"{review.comment}"</p></div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">— {review.first_name} {review.last_name} ({review.email})</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'CUSTOMERS' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {!selectedCustomer ? (
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 shadow-sm overflow-x-auto backdrop-blur-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800"><th className="p-6 text-[10px] font-bold uppercase text-zinc-300">Identity</th><th className="p-6 text-[10px] font-bold uppercase text-zinc-300">Designation</th><th className="p-6 text-[10px] font-bold uppercase text-zinc-300 text-right">Contribution</th></tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.customer_id} className="border-b border-zinc-50 dark:border-zinc-800/30 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 cursor-pointer" onClick={() => fetchCustomerActivity(customer)}>
                            <td className="p-6 text-[11px] font-bold text-zinc-400 uppercase">USR-{customer.customer_id.toString().padStart(5, '0')}</td>
                            <td className="p-6"><p className="text-sm font-light text-zinc-700 dark:text-zinc-200 uppercase">{customer.first_name} {customer.last_name}</p><p className="text-[9px] text-zinc-300 font-bold uppercase mt-1">{customer.email}</p></td>
                            <td className="p-6 text-sm font-bold text-zinc-800 dark:text-zinc-100 text-right">${parseFloat(customer.total_spent).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-6"><button onClick={() => setSelectedCustomer(null)} className="p-3 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button><h2 className="text-xl font-light text-zinc-700 dark:text-zinc-200 uppercase tracking-tight">{selectedCustomer.first_name} {selectedCustomer.last_name} // Intelligence</h2></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6"><h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b pb-3">Hardware Log</h4>
                        {detailLoading ? (<p className="text-[10px] font-bold text-zinc-300 animate-pulse">Syncing...</p>) : (
                          <div className="space-y-4">{customerActivity?.items.map((item, idx) => (<div key={idx} className="bg-white dark:bg-zinc-900/20 border p-4 flex items-center gap-4"><div className="w-10 h-10 bg-white p-1">{item.image_url ? <img src={item.image_url} className="w-full h-full object-contain" /> : null}</div><div className="flex-grow"><p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase">{item.name}</p><p className="text-[9px] text-zinc-400 uppercase mt-0.5">ORD-{item.order_id}</p></div><p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">${parseFloat(item.unit_price).toLocaleString()}</p></div>))}</div>
                        )}
                      </div>
                      <div className="space-y-6"><h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b pb-3">Evaluation Log</h4>
                        {detailLoading ? (<p className="text-[10px] font-bold text-zinc-300 animate-pulse">Scanning...</p>) : (
                          <div className="space-y-6">{customerActivity?.reviews.map((review) => (<div key={review.review_id} className="border-l-2 pl-6 py-2"><span className="text-[9px] font-bold text-zinc-300 uppercase">ORD-{review.order_id} // {new Date(review.created_at).toLocaleDateString()}</span><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">{review.product_name}</p><p className="text-xs font-light text-zinc-400 italic">"{review.comment}"</p></div>))}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <footer className="mt-12 py-12 border-t border-zinc-100 dark:border-zinc-900 text-center opacity-40">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-zinc-400">Admin Console v1.7.0 // Tech Forge Control System</p>
      </footer>
    </div>
  );
}
