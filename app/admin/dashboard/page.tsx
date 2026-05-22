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
  image_url?: string | null;
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

type Tab = 'OVERVIEW' | 'INVENTORY' | 'PROFITS' | 'ORDERS' | 'SATISFACTION' | 'CUSTOMERS';
type OrderStatusFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
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
    OVERVIEW: '',
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSatIndex, setHoveredSatIndex] = useState<{ type: 'comp' | 'acc'; index: number } | null>(null);
  const [hoveredOverviewIndex, setHoveredOverviewIndex] = useState<number | null>(null);

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
      
      if (activeTab === 'OVERVIEW') {
        const res = await fetch(`/api/v1/admin/profits?query=${query}`, { headers });
        if (res.ok) setProfits(await res.json());
      } else if (activeTab === 'INVENTORY') {
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
              { id: 'OVERVIEW', label: 'Overview' },
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
            {activeTab !== 'OVERVIEW' && (
              <section className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm flex items-center gap-6 animate-in fade-in duration-300">
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
            )}

            {activeTab === 'OVERVIEW' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                {(() => {
                  const sortedProfits = [...profits].sort((a, b) => a.month.localeCompare(b.month));
                  const maxIncomeVal = Math.max(...sortedProfits.map(p => parseFloat(p.total_income) || 0), 0);
                  const maxInvestmentVal = Math.max(...sortedProfits.map(p => parseFloat(p.total_investment) || 0), 0);
                  const maxProfitVal = Math.max(...sortedProfits.map(p => parseFloat(p.net_profit) || 0), 0);
                  const chartMaxVal = Math.max(maxIncomeVal, maxInvestmentVal, maxProfitVal, 100);
                  const chartYLimit = chartMaxVal * 1.15;

                  const overallIncome = sortedProfits.reduce((acc, p) => acc + (parseFloat(p.total_income) || 0), 0);
                  const overallInvestment = sortedProfits.reduce((acc, p) => acc + (parseFloat(p.total_investment) || 0), 0);
                  const overallNetProfit = sortedProfits.reduce((acc, p) => acc + (parseFloat(p.net_profit) || 0), 0);
                  const overallNetMargin = overallIncome > 0 ? (overallNetProfit / overallIncome) * 100 : 0;

                  if (sortedProfits.length === 0) {
                    return (
                      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-12 text-center shadow-sm">
                        <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest animate-pulse">Awaiting longitudinal financial data feed...</p>
                      </div>
                    );
                  }

                  const totalMonths = sortedProfits.length;
                  const slotWidth = totalMonths > 1 ? 680 / (totalMonths - 1) : 680;

                  const incomePoints = sortedProfits.map((p, i) => ({
                    x: 60 + i * slotWidth,
                    y: 260 - ((parseFloat(p.total_income) || 0) / chartYLimit) * 220,
                    val: parseFloat(p.total_income) || 0,
                    month: p.month
                  }));
                  const investmentPoints = sortedProfits.map((p, i) => ({
                    x: 60 + i * slotWidth,
                    y: 260 - ((parseFloat(p.total_investment) || 0) / chartYLimit) * 220,
                    val: parseFloat(p.total_investment) || 0,
                    month: p.month
                  }));
                  const profitPoints = sortedProfits.map((p, i) => ({
                    x: 60 + i * slotWidth,
                    y: 260 - ((parseFloat(p.net_profit) || 0) / chartYLimit) * 220,
                    val: parseFloat(p.net_profit) || 0,
                    month: p.month
                  }));

                  const incomePathD = incomePoints.length > 1 ? incomePoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '') : '';
                  const investmentPathD = investmentPoints.length > 1 ? investmentPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '') : '';
                  const profitPathD = profitPoints.length > 1 ? profitPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '') : '';

                  const incomeAreaD = incomePoints.length > 1 ? `${incomePathD} L ${incomePoints[incomePoints.length - 1].x} 260 L ${incomePoints[0].x} 260 Z` : '';
                  const investmentAreaD = investmentPoints.length > 1 ? `${investmentPathD} L ${investmentPoints[investmentPoints.length - 1].x} 260 L ${investmentPoints[0].x} 260 Z` : '';
                  const profitAreaD = profitPoints.length > 1 ? `${profitPathD} L ${profitPoints[profitPoints.length - 1].x} 260 L ${profitPoints[0].x} 260 Z` : '';

                  const activeHoveredMonth = hoveredOverviewIndex !== null ? sortedProfits[hoveredOverviewIndex] : null;

                  return (
                    <>
                      {/* Comparative Financial Line Graph */}
                      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-6 shadow-sm backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Website Revenue & Cost Overview</h3>
                            <p className="text-[9px] text-zinc-300 dark:text-zinc-500 font-mono mt-1">LONGITUDINAL COMPARATIVE TRAJECTORY (INCOME VS INVESTMENT VS PROFIT)</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Income</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Investment</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Net Profit</span>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <svg viewBox="0 0 800 320" className="w-full h-auto">
                            <defs>
                              <linearGradient id="overviewIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="overviewInvestmentGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="overviewProfitGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Y-Axis Grid Lines & Labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                              const val = chartYLimit * ratio;
                              const y = 260 - ratio * 220;
                              return (
                                <g key={idx}>
                                  <line 
                                    x1="60" 
                                    y1={y} 
                                    x2="780" 
                                    y2={y} 
                                    stroke="currentColor" 
                                    className="text-zinc-100 dark:text-zinc-800/60" 
                                    strokeDasharray="4 4" 
                                  />
                                  <text 
                                    x="50" 
                                    y={y + 3} 
                                    textAnchor="end" 
                                    className="text-[9px] font-bold fill-zinc-400 dark:fill-zinc-500 font-mono"
                                  >
                                    ${(val >= 1000 ? (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : val.toFixed(0))}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Hover Snapping Vertical Line */}
                            {hoveredOverviewIndex !== null && (
                              <line 
                                x1={60 + hoveredOverviewIndex * slotWidth} 
                                y1="40" 
                                x2={60 + hoveredOverviewIndex * slotWidth} 
                                y2="260" 
                                stroke="currentColor" 
                                className="text-zinc-200 dark:text-zinc-800/80" 
                                strokeDasharray="3 3" 
                                strokeWidth="1.5"
                              />
                            )}

                            {/* Area Gradient Fills */}
                            {incomeAreaD && <path d={incomeAreaD} fill="url(#overviewIncomeGrad)" className="animate-in fade-in duration-500" />}
                            {investmentAreaD && <path d={investmentAreaD} fill="url(#overviewInvestmentGrad)" className="animate-in fade-in duration-500" />}
                            {profitAreaD && <path d={profitAreaD} fill="url(#overviewProfitGrad)" className="animate-in fade-in duration-500" />}

                            {/* Line Curves */}
                            {incomePathD && (
                              <path 
                                d={incomePathD} 
                                fill="none" 
                                stroke="#6366f1" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="opacity-95"
                              />
                            )}
                            {investmentPathD && (
                              <path 
                                d={investmentPathD} 
                                fill="none" 
                                stroke="#f43f5e" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="opacity-95"
                              />
                            )}
                            {profitPathD && (
                              <path 
                                d={profitPathD} 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="opacity-95"
                              />
                            )}

                            {/* Interactive Hover Areas (snapping overlays) */}
                            {sortedProfits.map((_, idx) => {
                              const x = 60 + idx * slotWidth;
                              return (
                                <rect
                                  key={`hover-rect-${idx}`}
                                  x={x - slotWidth / 2}
                                  y="20"
                                  width={slotWidth}
                                  height="250"
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredOverviewIndex(idx)}
                                  onMouseLeave={() => setHoveredOverviewIndex(null)}
                                />
                              );
                            })}

                            {/* Data Dots - Income */}
                            {incomePoints.map((p, idx) => (
                              <circle 
                                key={`income-pt-${idx}`}
                                cx={p.x} 
                                cy={p.y} 
                                r={hoveredOverviewIndex === idx ? 5.5 : 3} 
                                fill="#6366f1"
                                stroke="currentColor"
                                className="text-white dark:text-zinc-950 pointer-events-none transition-all duration-150"
                                strokeWidth={hoveredOverviewIndex === idx ? 2 : 1}
                              />
                            ))}

                            {/* Data Dots - Investment */}
                            {investmentPoints.map((p, idx) => (
                              <circle 
                                key={`invest-pt-${idx}`}
                                cx={p.x} 
                                cy={p.y} 
                                r={hoveredOverviewIndex === idx ? 5.5 : 3} 
                                fill="#f43f5e"
                                stroke="currentColor"
                                className="text-white dark:text-zinc-950 pointer-events-none transition-all duration-150"
                                strokeWidth={hoveredOverviewIndex === idx ? 2 : 1}
                              />
                            ))}

                            {/* Data Dots - Profit */}
                            {profitPoints.map((p, idx) => (
                              <circle 
                                key={`profit-pt-${idx}`}
                                cx={p.x} 
                                cy={p.y} 
                                r={hoveredOverviewIndex === idx ? 5.5 : 3} 
                                fill="#10b981"
                                stroke="currentColor"
                                className="text-white dark:text-zinc-950 pointer-events-none transition-all duration-150"
                                strokeWidth={hoveredOverviewIndex === idx ? 2 : 1}
                              />
                            ))}

                            {/* X-Axis Month labels */}
                            {sortedProfits.map((p, idx) => {
                              const x = 60 + idx * slotWidth;
                              return (
                                <text 
                                  key={idx}
                                  x={x} 
                                  y="290" 
                                  textAnchor="middle" 
                                  className="text-[8px] font-bold fill-zinc-400 dark:fill-zinc-500 font-mono uppercase"
                                >
                                  {(() => {
                                    const [year, month] = p.month.split('-');
                                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                                    return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
                                  })()}
                                </text>
                              );
                            })}
                          </svg>

                          {/* Hover Tooltip Card */}
                          {hoveredOverviewIndex !== null && activeHoveredMonth && (
                            <div className="absolute top-2 right-2 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 p-4 shadow-xl pointer-events-none font-mono min-w-[210px] animate-in fade-in zoom-in-95 duration-100 z-10">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 border-b pb-1 mb-2">
                                {(() => {
                                  const [year, month] = activeHoveredMonth.month.split('-');
                                  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                                  return `${months[parseInt(month, 10) - 1]} 20${year.slice(2)}`;
                                })()}
                              </p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between gap-4">
                                  <span className="text-zinc-400 uppercase text-[9px] font-bold">Total Income:</span>
                                  <span className="font-bold text-indigo-500">${parseFloat(activeHoveredMonth.total_income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-zinc-400 uppercase text-[9px] font-bold">Investment:</span>
                                  <span className="font-bold text-rose-500">${parseFloat(activeHoveredMonth.total_investment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5 font-bold">
                                  <span className="text-zinc-400 uppercase text-[9px] font-bold">Net Profit:</span>
                                  <span className="text-emerald-500">${parseFloat(activeHoveredMonth.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-zinc-400 uppercase text-[9px] font-bold">Net Margin:</span>
                                  <span className="text-zinc-800 dark:text-zinc-200">
                                    {(parseFloat(activeHoveredMonth.total_income) > 0 
                                      ? (parseFloat(activeHoveredMonth.net_profit) / parseFloat(activeHoveredMonth.total_income) * 100).toFixed(1)
                                      : '0.0')}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Overall Metrics Block combining values */}
                      <div className="space-y-4 animate-in fade-in duration-500">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Consolidated Financial Overview</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Overall Income (Revenue)</p>
                              <p className="text-3xl font-light text-zinc-700 dark:text-zinc-200">${overallIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-850 mt-4 pt-3 flex justify-between items-center">
                              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Aggregate Sales</span>
                              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Overall Investments (Costs)</p>
                              <p className="text-3xl font-light text-zinc-700 dark:text-zinc-200">${overallInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-850 mt-4 pt-3 flex justify-between items-center">
                              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Aggregate Cost of Goods</span>
                              <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Overall Net Profit</p>
                              <p className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">${overallNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-850 mt-4 pt-3 flex justify-between items-center">
                              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Aggregate Net Profits</span>
                              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Overall Net Margin</p>
                              <p className="text-3xl font-light text-zinc-700 dark:text-zinc-200">{overallNetMargin.toFixed(1)}%</p>
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-850 mt-4 pt-3 flex justify-between items-center">
                              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Net Revenue Retention</span>
                              <span className="text-[9px] font-bold text-emerald-500 font-mono">+{overallNetMargin.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </section>
            )}

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
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-center">Schematic</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Product Name</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-right">Unit Price</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 text-center">Stock</th>
                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300">Visibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.product_id} className="border-b border-zinc-50 dark:border-zinc-800/30 group">
                          <td className="p-6 text-[11px] font-bold text-zinc-400">STK-{product.product_id}</td>
                          <td className="p-6">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1 flex items-center justify-center overflow-hidden mx-auto shadow-sm">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name} 
                                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" 
                                />
                              ) : (
                                <div className="text-[9px] font-bold text-zinc-350 dark:text-zinc-650 uppercase tracking-tighter">NO IMG</div>
                              )}
                            </div>
                          </td>
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
                  <>
                    {(() => {
                      const sortedProfits = [...profits].sort((a, b) => a.month.localeCompare(b.month));
                      const maxIncomeVal = Math.max(...sortedProfits.map(p => parseFloat(p.total_income) || 0), 0);
                      const maxProfitVal = Math.max(...sortedProfits.map(p => parseFloat(p.net_profit) || 0), 0);
                      const chartMaxVal = Math.max(maxIncomeVal, maxProfitVal, 100);
                      const chartYLimit = chartMaxVal * 1.15;

                      return (
                        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-6 shadow-sm backdrop-blur-sm mb-8 animate-in fade-in duration-300">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Financial Trend Analysis</h3>
                              <p className="text-[9px] text-zinc-300 dark:text-zinc-500 font-mono mt-1">MONTHLY COMPARATIVE LEDGER (REVENUE VS NET PROFIT)</p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Revenue</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Net Profit</span>
                              </div>
                            </div>
                          </div>

                          {sortedProfits.length === 0 ? (
                            <div className="h-64 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800/50">
                              <p className="text-xs text-zinc-400 tracking-widest font-mono">NO FINANCIAL DATA RETRIEVED</p>
                            </div>
                          ) : (
                            <div className="relative">
                              <svg viewBox="0 0 800 320" className="w-full h-auto">
                                <defs>
                                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#4f46e5" />
                                  </linearGradient>
                                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#059669" />
                                  </linearGradient>
                                </defs>

                                {/* Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                                  const val = chartYLimit * ratio;
                                  const y = 260 - ratio * 220;
                                  return (
                                    <g key={idx}>
                                      <line 
                                        x1="60" 
                                        y1={y} 
                                        x2="780" 
                                        y2={y} 
                                        stroke="currentColor" 
                                        className="text-zinc-100 dark:text-zinc-800/40" 
                                        strokeDasharray="4 4" 
                                      />
                                      <text 
                                        x="50" 
                                        y={y + 3} 
                                        textAnchor="end" 
                                        className="text-[9px] font-bold fill-zinc-400 dark:fill-zinc-500 font-mono"
                                      >
                                        ${(val >= 1000 ? (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : val.toFixed(0))}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Bars and labels */}
                                {(() => {
                                  const slotWidth = 720 / sortedProfits.length;
                                  const barWidth = Math.max(slotWidth * 0.25, 8);
                                  const spaceBetweenBars = 3;

                                  return sortedProfits.map((item, index) => {
                                    const centerX = 60 + (index + 0.5) * slotWidth;
                                    const incVal = parseFloat(item.total_income) || 0;
                                    const prfVal = parseFloat(item.net_profit) || 0;

                                    const incHeight = (incVal / chartYLimit) * 220;
                                    const prfHeight = (prfVal / chartYLimit) * 220;

                                    const incY = 260 - incHeight;
                                    const prfY = 260 - prfHeight;

                                    const incX = centerX - barWidth - spaceBetweenBars / 2;
                                    const prfX = centerX + spaceBetweenBars / 2;

                                    const isHovered = hoveredIndex === index;

                                    return (
                                      <g key={index}>
                                        {/* Highlight background on hover */}
                                        {isHovered && (
                                          <rect 
                                            x={centerX - slotWidth / 2 + 2} 
                                            y="30" 
                                            width={slotWidth - 4} 
                                            height="240" 
                                            fill="currentColor" 
                                            className="text-zinc-500/5 dark:text-zinc-200/5" 
                                            rx="4"
                                          />
                                        )}

                                        {/* Revenue Bar */}
                                        <rect 
                                          x={incX} 
                                          y={incY} 
                                          width={barWidth} 
                                          height={Math.max(incHeight, 2)} 
                                          fill="url(#incomeGrad)" 
                                          className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                                          rx="2"
                                        />

                                        {/* Net Profit Bar */}
                                        <rect 
                                          x={prfX} 
                                          y={prfY} 
                                          width={barWidth} 
                                          height={Math.max(prfHeight, 2)} 
                                          fill="url(#profitGrad)" 
                                          className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                                          rx="2"
                                        />

                                        {/* X-axis Month label */}
                                        <text 
                                          x={centerX} 
                                          y="285" 
                                          textAnchor="middle" 
                                          className={`text-[9px] font-bold uppercase font-mono tracking-tight ${isHovered ? 'fill-zinc-800 dark:fill-zinc-100' : 'fill-zinc-400 dark:fill-zinc-500'}`}
                                        >
                                          {(() => {
                                            const [year, month] = item.month.split('-');
                                            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                                            const monthIdx = parseInt(month, 10) - 1;
                                            return `${months[monthIdx]} '${year.slice(2)}`;
                                          })()}
                                        </text>

                                        {/* Full slot hover overlay trigger */}
                                        <rect 
                                          x={centerX - slotWidth / 2} 
                                          y="30" 
                                          width={slotWidth} 
                                          height="260" 
                                          fill="transparent" 
                                          className="cursor-pointer"
                                          onMouseEnter={() => setHoveredIndex(index)}
                                          onMouseLeave={() => setHoveredIndex(null)}
                                          onClick={() => fetchMonthlyDetails(item.month)}
                                        />
                                      </g>
                                    );
                                  });
                                })()}
                              </svg>

                              {/* Interactive Tooltip Card */}
                              {hoveredIndex !== null && sortedProfits[hoveredIndex] && (
                                <div className="absolute top-2 right-2 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 p-4 shadow-xl pointer-events-none font-mono min-w-[200px] animate-in fade-in zoom-in-95 duration-150 z-20">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5 mb-2">
                                    Period: {(() => {
                                      const [year, month] = sortedProfits[hoveredIndex].month.split('-');
                                      const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                                      return `${months[parseInt(month, 10) - 1]} 20${year.slice(2)}`;
                                    })()}
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-zinc-400 uppercase text-[9px] font-bold">Revenue:</span>
                                      <span className="font-bold text-zinc-700 dark:text-zinc-200">
                                        ${parseFloat(sortedProfits[hoveredIndex].total_income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-zinc-400 uppercase text-[9px] font-bold">Investment:</span>
                                      <span className="font-light text-zinc-500 dark:text-zinc-400">
                                        ${parseFloat(sortedProfits[hoveredIndex].total_investment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5 mt-1.5">
                                      <span className="text-zinc-400 uppercase text-[9px] font-bold">Net Profit:</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        ${parseFloat(sortedProfits[hoveredIndex].net_profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-zinc-400 uppercase text-[9px] font-bold">Margin:</span>
                                      <span className="font-bold text-indigo-500">
                                        {(() => {
                                          const inc = parseFloat(sortedProfits[hoveredIndex].total_income) || 0;
                                          const prf = parseFloat(sortedProfits[hoveredIndex].net_profit) || 0;
                                          return inc > 0 ? ((prf / inc) * 100).toFixed(1) + '%' : '0.0%';
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

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
                  </>
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

                {/* Comparative Satisfaction Line Graph */}
                {(() => {
                  const sortedReviews = [...reviews].sort((a, b) => a.created_at.localeCompare(b.created_at));

                  // Group by month
                  const monthlyStatsMap: Record<string, { compCount: number; compSum: number; accCount: number; accSum: number }> = {};

                  sortedReviews.forEach(r => {
                    if (!r.created_at) return;
                    const month = r.created_at.slice(0, 7); // "YYYY-MM"
                    if (!monthlyStatsMap[month]) {
                      monthlyStatsMap[month] = { compCount: 0, compSum: 0, accCount: 0, accSum: 0 };
                    }
                    
                    const nameLower = r.product_name.toLowerCase();
                    const isComputer = nameLower.includes('macbook') || 
                                       nameLower.includes('zephyrus') || 
                                       nameLower.includes('loq') || 
                                       nameLower.includes('laptop') || 
                                       nameLower.includes('ipad') || 
                                       nameLower.includes('air');
                                        
                    if (isComputer) {
                      monthlyStatsMap[month].compCount += 1;
                      monthlyStatsMap[month].compSum += r.rating;
                    } else {
                      monthlyStatsMap[month].accCount += 1;
                      monthlyStatsMap[month].accSum += r.rating;
                    }
                  });

                  const chartMonths = Object.keys(monthlyStatsMap).sort();
                  const totalMonths = chartMonths.length;

                  if (totalMonths < 2) {
                    return (
                      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-8 text-center">
                        <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Awaiting sufficient longitudinal feedback data...</p>
                      </div>
                    );
                  }

                  const slotWidth = 700 / (totalMonths - 1);

                  const linePoints = chartMonths.map(month => {
                    const stats = monthlyStatsMap[month];
                    const compAvg = stats.compCount > 0 ? stats.compSum / stats.compCount : null;
                    const accAvg = stats.accCount > 0 ? stats.accSum / stats.accCount : null;
                    return { month, compAvg, accAvg };
                  });

                  const compPoints = linePoints
                    .map((p, i) => ({ x: 50 + i * slotWidth, y: p.compAvg !== null ? 220 - ((p.compAvg - 1) / 4) * 200 : null, val: p.compAvg, month: p.month }))
                    .filter(p => p.y !== null) as Array<{ x: number; y: number; val: number; month: string }>;

                  const accPoints = linePoints
                    .map((p, i) => ({ x: 50 + i * slotWidth, y: p.accAvg !== null ? 220 - ((p.accAvg - 1) / 4) * 200 : null, val: p.accAvg, month: p.month }))
                    .filter(p => p.y !== null) as Array<{ x: number; y: number; val: number; month: string }>;

                  const compPathD = compPoints.length > 1
                    ? compPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')
                    : '';
                  const accPathD = accPoints.length > 1
                    ? accPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')
                    : '';

                  const compAreaD = compPoints.length > 1
                    ? `${compPathD} L ${compPoints[compPoints.length - 1].x} 220 L ${compPoints[0].x} 220 Z`
                    : '';
                  const accAreaD = accPoints.length > 1
                    ? `${accPathD} L ${accPoints[accPoints.length - 1].x} 220 L ${accPoints[0].x} 220 Z`
                    : '';

                  // All-time categories averages
                  const allCompRatings = reviews.filter(r => {
                    const nameLower = r.product_name.toLowerCase();
                    return nameLower.includes('macbook') || nameLower.includes('zephyrus') || nameLower.includes('loq') || nameLower.includes('laptop') || nameLower.includes('ipad') || nameLower.includes('air');
                  });
                  const allAccRatings = reviews.filter(r => !allCompRatings.includes(r));
                  const compAvgAll = allCompRatings.length > 0 ? (allCompRatings.reduce((acc, r) => acc + r.rating, 0) / allCompRatings.length).toFixed(1) : 'N/A';
                  const accAvgAll = allAccRatings.length > 0 ? (allAccRatings.reduce((acc, r) => acc + r.rating, 0) / allAccRatings.length).toFixed(1) : 'N/A';

                  const activeHoveredPoint = hoveredSatIndex 
                    ? (hoveredSatIndex.type === 'comp' ? compPoints[hoveredSatIndex.index] : accPoints[hoveredSatIndex.index])
                    : null;

                  return (
                    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-6 shadow-sm backdrop-blur-sm animate-in fade-in duration-300">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Satisfaction Trend Analysis</h3>
                          <p className="text-[9px] text-zinc-300 dark:text-zinc-500 font-mono mt-1">MONTHLY HARDWARE EVALUATIONS (SYSTEMS VS ACCESSORIES)</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Systems ({compAvgAll} ★)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Accessories ({accAvgAll} ★)</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <svg viewBox="0 0 770 250" className="w-full h-auto">
                          <defs>
                            <linearGradient id="compAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0"/>
                            </linearGradient>
                            <linearGradient id="accAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>

                          {/* Y-Axis Grid Lines & Labels */}
                          {[1, 2, 3, 4, 5].map((starValue) => {
                            const y = 220 - ((starValue - 1) / 4) * 200;
                            return (
                              <g key={starValue}>
                                <line 
                                  x1="50" 
                                  y1={y} 
                                  x2="750" 
                                  y2={y} 
                                  stroke="currentColor" 
                                  className="text-zinc-100 dark:text-zinc-800/80" 
                                  strokeDasharray="4 4" 
                                />
                                <text 
                                  x="40" 
                                  y={y + 3} 
                                  textAnchor="end" 
                                  className="text-[9px] font-bold fill-zinc-400 dark:fill-zinc-500 font-mono"
                                >
                                  {starValue}.0 ★
                                </text>
                              </g>
                            );
                          })}

                          {/* Hover Vertical Guide Line */}
                          {activeHoveredPoint && (
                            <line 
                              x1={activeHoveredPoint.x} 
                              y1="20" 
                              x2={activeHoveredPoint.x} 
                              y2="220" 
                              stroke="currentColor" 
                              className="text-zinc-200 dark:text-zinc-800/60" 
                              strokeDasharray="3 3" 
                              strokeWidth="1.5"
                            />
                          )}

                          {/* Area Paths for Gradient Fill */}
                          {compAreaD && (
                            <path 
                              d={compAreaD} 
                              fill="url(#compAreaGradient)" 
                              className="animate-in fade-in duration-500"
                            />
                          )}
                          {accAreaD && (
                            <path 
                              d={accAreaD} 
                              fill="url(#accAreaGradient)" 
                              className="animate-in fade-in duration-500"
                            />
                          )}

                          {/* Line Paths */}
                          {compPathD && (
                            <path 
                              d={compPathD} 
                              fill="none" 
                              stroke="#0ea5e9" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className="opacity-90"
                            />
                          )}
                          {accPathD && (
                            <path 
                              d={accPathD} 
                              fill="none" 
                              stroke="#f59e0b" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className="opacity-90"
                            />
                          )}

                          {/* Data Nodes - Systems */}
                          {compPoints.map((p, idx) => {
                            const isHovered = hoveredSatIndex?.type === 'comp' && hoveredSatIndex?.index === idx;
                            return (
                              <circle 
                                key={`comp-pt-${idx}`}
                                cx={p.x} 
                                cy={p.y} 
                                r={isHovered ? 6 : 3.5} 
                                fill="#0ea5e9"
                                stroke="currentColor"
                                className="text-white dark:text-zinc-950 cursor-pointer transition-all duration-150"
                                strokeWidth={isHovered ? 2.5 : 1.5}
                                onMouseEnter={() => setHoveredSatIndex({ type: 'comp', index: idx })}
                                onMouseLeave={() => setHoveredSatIndex(null)}
                              />
                            );
                          })}

                          {/* Data Nodes - Accessories */}
                          {accPoints.map((p, idx) => {
                            const isHovered = hoveredSatIndex?.type === 'acc' && hoveredSatIndex?.index === idx;
                            return (
                              <circle 
                                key={`acc-pt-${idx}`}
                                cx={p.x} 
                                cy={p.y} 
                                r={isHovered ? 6 : 3.5} 
                                fill="#f59e0b"
                                stroke="currentColor"
                                className="text-white dark:text-zinc-950 cursor-pointer transition-all duration-150"
                                strokeWidth={isHovered ? 2.5 : 1.5}
                                onMouseEnter={() => setHoveredSatIndex({ type: 'acc', index: idx })}
                                onMouseLeave={() => setHoveredSatIndex(null)}
                              />
                            );
                          })}

                          {/* X-Axis Month labels */}
                          {linePoints.map((p, idx) => {
                            const x = 50 + idx * slotWidth;
                            return (
                              <text 
                                key={idx}
                                x={x} 
                                y="242" 
                                textAnchor="middle" 
                                className="text-[8px] font-bold fill-zinc-400 dark:fill-zinc-500 font-mono uppercase"
                              >
                                {(() => {
                                  const [year, month] = p.month.split('-');
                                  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                                  return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
                                })()}
                              </text>
                            );
                          })}
                        </svg>

                        {/* Interactive Sat Tooltip */}
                        {activeHoveredPoint && (
                          <div className="absolute top-2 right-2 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 p-3 shadow-xl pointer-events-none font-mono min-w-[180px] animate-in fade-in zoom-in-95 duration-100 z-10">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 border-b pb-1 mb-1.5">
                              {(() => {
                                const [year, month] = activeHoveredPoint.month.split('-');
                                const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                                return `${months[parseInt(month, 10) - 1]} 20${year.slice(2)}`;
                              })()}
                            </p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-4">
                                <span className="text-zinc-400 uppercase text-[9px] font-bold">Category:</span>
                                <span className={`font-bold uppercase text-[9px] ${hoveredSatIndex?.type === 'comp' ? 'text-sky-500' : 'text-amber-500'}`}>
                                  {hoveredSatIndex?.type === 'comp' ? 'Systems' : 'Accessories'}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-1">
                                <span className="text-zinc-400 uppercase text-[9px] font-bold">Avg Rating:</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-100 font-mono">
                                  {activeHoveredPoint.val.toFixed(2)} ★
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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
                    <div className="flex items-center gap-6"><button onClick={() => setSelectedCustomer(null)} className="p-3 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button><h2 className="text-xl font-light text-zinc-700 dark:text-zinc-200 uppercase tracking-tight">{selectedCustomer.first_name} {selectedCustomer.last_name} {"//"} Intelligence</h2></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6"><h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b pb-3">Hardware Log</h4>
                        {detailLoading ? (<p className="text-[10px] font-bold text-zinc-300 animate-pulse">Syncing...</p>) : (
                          <div className="space-y-4">{customerActivity?.items.map((item, idx) => (<div key={idx} className="bg-white dark:bg-zinc-900/20 border p-4 flex items-center gap-4"><div className="w-10 h-10 bg-white p-1">{item.image_url ? <img src={item.image_url} className="w-full h-full object-contain" /> : null}</div><div className="flex-grow"><p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase">{item.name}</p><p className="text-[9px] text-zinc-400 uppercase mt-0.5">ORD-{item.order_id}</p></div><p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">${parseFloat(item.unit_price).toLocaleString()}</p></div>))}</div>
                        )}
                      </div>
                      <div className="space-y-6"><h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b pb-3">Evaluation Log</h4>
                        {detailLoading ? (<p className="text-[10px] font-bold text-zinc-300 animate-pulse">Scanning...</p>) : (
                          <div className="space-y-6">{customerActivity?.reviews.map((review) => (<div key={review.review_id} className="border-l-2 pl-6 py-2"><span className="text-[9px] font-bold text-zinc-300 uppercase">ORD-{review.order_id} {"//"} {new Date(review.created_at).toLocaleDateString()}</span><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">{review.product_name}</p><p className="text-xs font-light text-zinc-400 italic">"{review.comment}"</p></div>))}</div>
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
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-zinc-400">Admin Console v1.7.0 {"//"} Tech Forge Control System</p>
      </footer>
    </div>
  );
}
