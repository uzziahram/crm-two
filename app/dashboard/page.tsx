'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  product_id: number;
  name: string;
  description: string;
  specifications: string;
  price: string;
  stock_quantity: number;
  image_url: string;
}

interface Review {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
  first_name: string;
  last_name: string;
}

export default function CustomerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'customer') {
      router.push('/');
      return;
    }

    fetchProducts();
  }, [router, searchQuery, sortBy, minPrice, maxPrice]); // Refetch on filter change

  useEffect(() => {
    if (selectedProduct) {
      setModalQuantity(1);
      fetchReviews(selectedProduct.product_id);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await fetch(`/api/v1/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId: number) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/v1/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: number, quantity: number = 1) => {
    e.stopPropagation(); 
    setAddingId(productId);
    setMessage(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/customers/cart/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: `${quantity} ${quantity > 1 ? 'ITEMS' : 'ITEM'} ADDED TO CART`, type: 'success' });
        if (selectedProduct) setSelectedProduct(null);
      } else {
        setMessage({ text: data.error || 'FAILED TO ADD ITEM', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'NETWORK ERROR', type: 'error' });
    } finally {
      setAddingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
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

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-background border border-zinc-200 dark:border-zinc-800 w-full max-w-6xl shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden max-h-[90vh] flex flex-col md:flex-row">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Modal Image */}
            <div className="bg-white border-r border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-12 overflow-hidden md:w-1/2 shrink-0">
              {selectedProduct.image_url ? (
                <img 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-zinc-200 dark:text-zinc-800 uppercase text-[10px] tracking-widest font-bold">No Image</div>
              )}
            </div>

            <div className="p-10 flex flex-col justify-between bg-white dark:bg-zinc-950 flex-grow overflow-y-auto">
              <div className="space-y-12">
                <div>
                  <div className="mb-8">
                    <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-zinc-400 mb-2">Technical Specifications</h2>
                    <h1 className="text-3xl font-light text-zinc-700 dark:text-zinc-200 uppercase tracking-tight">{selectedProduct.name}</h1>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-100 dark:border-zinc-900 pb-2">Overview</h3>
                      <p className="text-sm font-light text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">Technical Details</h3>
                      <div className="space-y-3">
                        {selectedProduct.specifications.split(',').map((spec, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="mt-1.5 w-1 h-1 bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                            <span className="text-[11px] font-light text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{spec.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-2 flex justify-between items-center">
                    Community Evaluation
                    <span className="text-zinc-300 dark:text-zinc-700">{reviews.length} Logs</span>
                  </h3>
                  
                  {reviewsLoading ? (
                    <p className="text-[10px] font-bold text-zinc-300 animate-pulse">Accessing Data...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-light italic">No user evaluations recorded for this model.</p>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.review_id} className="border-l-2 border-zinc-100 dark:border-zinc-800 pl-6 py-2">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex gap-1 text-zinc-800 dark:text-zinc-200">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <svg key={i} xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                              ))}
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 uppercase">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">"{review.comment}"</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase mt-2">— User: {review.first_name} {review.last_name[0]}.</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-6">
                  <div className="flex items-center justify-between pt-8 border-t border-zinc-100 dark:border-zinc-900">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">MSRP Value</p>
                      <p className="text-3xl font-light text-zinc-700 dark:text-zinc-200">${parseFloat(selectedProduct.price).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Set Quantity</p>
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-800">
                        <button 
                          onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm font-bold text-zinc-700 dark:text-zinc-200">{modalQuantity}</span>
                        <button 
                          onClick={() => setModalQuantity(Math.min(selectedProduct.stock_quantity, modalQuantity + 1))}
                          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => handleAddToCart(e, selectedProduct.product_id, modalQuantity)}
                    disabled={selectedProduct.stock_quantity === 0 || addingId === selectedProduct.product_id}
                    className="w-full py-5 bg-zinc-800 dark:bg-zinc-200 text-zinc-50 dark:text-zinc-800 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none disabled:opacity-50"
                  >
                    {addingId === selectedProduct.product_id ? 'PROCESSING...' : `Acquire ${modalQuantity} ${modalQuantity > 1 ? 'Units' : 'Product'}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-6 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div>
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">Customer Portal</h1>
          <h2 className="text-xl font-light text-zinc-600 dark:text-zinc-300 uppercase tracking-tight">Tech Forge</h2>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/profile"
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
            title="Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>
          <Link 
            href="/dashboard/orders"
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
          >
            Archives
          </Link>
          <Link 
            href="/dashboard/cart"
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            Cart
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto space-y-10">
        {/* Search and Filters Bar */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm flex flex-wrap items-end gap-8">
          <div className="flex-grow min-w-[300px] space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Search Hardware</label>
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="MODEL, SPECS, OR KEYWORDS..."
                className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 pl-10 text-sm font-light focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-700"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sort Intelligence</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-xs font-bold uppercase tracking-tighter outline-none focus:border-zinc-300 dark:focus:border-zinc-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Ascending</option>
              <option value="price-desc">Price: Descending</option>
            </select>
          </div>

          <div className="flex gap-4 items-end">
            <div className="space-y-2 text-center">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Min MSRP</label>
              <input 
                type="number" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-24 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light outline-none"
              />
            </div>
            <div className="space-y-2 text-center">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Max MSRP</label>
              <input 
                type="number" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="MAX"
                className="w-24 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-sm font-light outline-none"
              />
            </div>
          </div>

          {(searchQuery || minPrice || maxPrice || sortBy !== 'newest') && (
            <button 
              onClick={() => { setSearchQuery(''); setMinPrice(''); setMaxPrice(''); setSortBy('newest'); }}
              className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 hover:text-red-400 transition-colors mb-3"
            >
              Clear Filters [X]
            </button>
          )}
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-300 animate-pulse">Initializing Inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">No hardware matches current search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div 
                key={product.product_id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 flex flex-col shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all cursor-pointer group backdrop-blur-sm overflow-hidden"
              >
                {/* Product Card Image */}
                <div className="aspect-square bg-white border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden p-4">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-zinc-200 dark:text-zinc-800 uppercase text-[8px] tracking-widest font-bold">Image Pending</div>
                  )}
                </div>

                <div className="p-8 flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-light text-zinc-600 dark:text-zinc-300 uppercase tracking-tight leading-tight group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-[9px] font-bold text-zinc-300 border border-zinc-100 dark:border-zinc-800 px-2 py-0.5 uppercase tracking-tighter">
                        STK-{product.product_id}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-6 font-light leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-1">MSRP</p>
                        <p className="text-xl font-light text-zinc-700 dark:text-zinc-200">${parseFloat(product.price).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[9px] font-bold tracking-tighter ${product.stock_quantity > 0 ? 'text-zinc-400 dark:text-zinc-600' : 'text-red-300'}`}>
                          {product.stock_quantity > 0 ? `${product.stock_quantity} AVAILABLE` : 'SOLDOUT'}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleAddToCart(e, product.product_id)}
                      disabled={product.stock_quantity === 0 || addingId === product.product_id}
                      className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:text-white dark:hover:text-zinc-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-200 dark:border-zinc-700 shadow-sm"
                    >
                      {addingId === product.product_id ? 'WAIT...' : 'Add to Cart'}
                    </button>
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
          Tech Forge Catalog v1.2.0 // CRM Two System
        </p>
      </footer>
    </div>
  );
}
