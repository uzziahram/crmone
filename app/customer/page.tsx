"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";
import { getActiveCustomerId } from "@/lib/active-customer";

type Product = {
  product_id: number;
  product_name: string;
  sku: string;
  category?: string;
  size?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
};

type CustomerProfile = {
  customer_id: number;
  full_name: string;
  email?: string;
  contact_number?: string;
  address?: string;
  orders?: Array<{
    order_id: number;
    order_date: string;
    total_amount: number;
    status: string;
  }>;
  cart_items?: Array<{
    cart_item_id: number;
    quantity: number;
  }>;
};

type GroupedProduct = {
  groupKey: string;
  product_name: string;
  category?: string;
  variants: Product[];
  minPrice: number;
  maxPrice: number;
  displayImage?: string;
};

export default function CustomerDashboardPage() {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(
    null
  );
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [qtyByProduct, setQtyByProduct] = useState<Record<number, number>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<Record<string, number>>({});
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modal State
  const [selectedGroupForModal, setSelectedGroupForModal] = useState<GroupedProduct | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  async function loadData(activeId: number) {
    setLoading(true);
    setError("");
    try {
      const [productData, customerData] = await Promise.all([
        apiRequest<Product[]>("/api/products"),
        apiRequest<CustomerProfile>(`/api/customer/${activeId}`),
      ]);
      setProducts(productData);
      
      // Initialize quantities and default variants
      const initialQtys: Record<number, number> = {};
      const initialVariants: Record<string, number> = {};
      const seenGroups = new Set<string>();

      productData.forEach(p => {
        initialQtys[p.product_id] = 1;
        
        const groupKey = `${p.product_name.toLowerCase()}@${(p.category || "General").toLowerCase()}`;
        
        if (!seenGroups.has(groupKey)) {
          initialVariants[groupKey] = p.product_id;
          seenGroups.add(groupKey);
        }
      });

      setQtyByProduct(initialQtys);
      setSelectedVariantId(initialVariants);
      
      setCustomerProfile(customerData);
      const totalItems =
        customerData.cart_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
      setCartCount(totalItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = getActiveCustomerId();
    setCustomerId(id);
    if (id) {
      void loadData(id);
    } else {
      setLoading(false);
    }
  }, []);

  async function addToCart(productId: number) {
    if (!customerId) return;
    const quantity = qtyByProduct[productId] ?? 1;

    setMessage("");
    setError("");
    setAddingProductId(productId);
    try {
      await apiRequest<{ message: string }>("/api/products/addToCart", {
        method: "POST",
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          quantity,
        }),
      });
      setCartCount((prev) => prev + quantity);
      setMessage("Added to cart successfully!");
      setTimeout(() => setMessage(""), 3000);
      setSelectedGroupForModal(null); // Close modal after adding
    } catch (cartError) {
      setError(cartError instanceof Error ? cartError.message : "Failed to add to cart");
    } finally {
      setAddingProductId(null);
    }
  }

  // Derived Categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || "General"));
    return ["All", ...Array.from(cats)];
  }, [products]);

  // Grouped and Filtered Products
  const filteredGroupedProducts = useMemo(() => {
    const groups: Record<string, GroupedProduct> = {};

    products.forEach(p => {
      const matchesSearch = p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || (p.category || "General") === selectedCategory;

      if (matchesSearch && matchesCategory) {
        const groupKey = `${p.product_name.toLowerCase()}@${(p.category || "General").toLowerCase()}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            groupKey,
            product_name: p.product_name,
            category: p.category,
            variants: [],
            minPrice: p.price,
            maxPrice: p.price,
            displayImage: p.image_url
          };
        }
        groups[groupKey].variants.push(p);
        groups[groupKey].minPrice = Math.min(groups[groupKey].minPrice, p.price);
        groups[groupKey].maxPrice = Math.max(groups[groupKey].maxPrice, p.price);
        if (!groups[groupKey].displayImage && p.image_url) {
          groups[groupKey].displayImage = p.image_url;
        }
      }
    });

    return Object.values(groups);
  }, [products, searchQuery, selectedCategory]);

  if (!customerId && !loading) {
    return (
      <AppShell title="Customer Access Required">
        <div className="saas-card p-8 text-center max-w-md mx-auto">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Not Logged In</h2>
          <p className="text-slate-600 mb-6">
            Please log in as a customer to access the product catalog and your orders.
          </p>
          <Link href="/loginpage" className="saas-button-primary w-full">
            Go to Login
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Welcome, ${customerProfile?.full_name || "Customer"}`}>
      <div className="space-y-8">
        {/* Top Section: Search & Cart Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 saas-card p-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search products..." 
                className="saas-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Filter By</label>
              <select 
                className="saas-input py-2 min-w-[140px]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="saas-card p-6 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-black leading-none">{cartCount}</p>
                <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-wider mt-1">Items in Cart</p>
              </div>
            </div>
            <Link href="/customer/cart" className="rounded-lg bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/30 transition-colors">
              View Cart
            </Link>
          </div>
        </div>

        {/* Main Content: Product Catalog */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Product Catalog</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {filteredGroupedProducts.length} unique products
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="saas-card p-6 animate-pulse">
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl mb-4"></div>
                  <div className="h-6 w-3/4 bg-slate-100 rounded mb-4"></div>
                  <div className="h-4 w-1/2 bg-slate-100 rounded mb-8"></div>
                  <div className="h-10 w-full bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredGroupedProducts.length === 0 ? (
            <div className="saas-card p-12 text-center">
              <p className="text-slate-500 italic">No products match your search.</p>
              <button 
                onClick={() => {setSearchQuery(""); setSelectedCategory("All");}}
                className="mt-4 text-indigo-600 font-bold text-sm"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroupedProducts.map((group) => {
                const currentVariantId = selectedVariantId[group.groupKey];
                const currentVariant = group.variants.find(v => v.product_id === currentVariantId) || group.variants[0];

                return (
                  <article 
                    key={group.groupKey} 
                    className="saas-card flex flex-col p-4 overflow-hidden group cursor-pointer hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-50/50"
                    onClick={() => setSelectedGroupForModal(group)}
                  >
                    <div className="relative aspect-[3/4] w-full bg-slate-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                      {group.displayImage ? (
                        <img 
                          src={group.displayImage} 
                          alt={group.product_name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-slate-200 text-5xl">👕</div>
                      )}
                      <div className="absolute top-3 right-3">
                         <span className={`saas-badge ${currentVariant.stock_quantity < 10 ? "saas-badge-warning" : "saas-badge-success"}`}>
                            {currentVariant.stock_quantity > 0 ? `${currentVariant.stock_quantity} In Stock` : "Out of Stock"}
                         </span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                          {group.category || "General"}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {group.product_name}
                        </h3>
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {group.minPrice === group.maxPrice ? `$${group.minPrice}` : `$${group.minPrice} - $${group.maxPrice}`}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-4">
                      SKU: {currentVariant.sku}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                        View Details
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedGroupForModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedGroupForModal(null)}>
          <div 
            className="saas-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:w-1/2 bg-slate-50 flex items-center justify-center relative min-h-[300px]">
              {selectedGroupForModal.displayImage ? (
                <img 
                  src={selectedGroupForModal.displayImage} 
                  alt={selectedGroupForModal.product_name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-slate-200 text-8xl">👕</div>
              )}
              <button 
                onClick={() => setSelectedGroupForModal(null)}
                className="absolute top-4 left-4 md:hidden h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center text-slate-900"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="md:w-1/2 p-8 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
                    {selectedGroupForModal.category || "General"}
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    {selectedGroupForModal.product_name}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedGroupForModal(null)}
                  className="hidden md:flex h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {(() => {
                const currentVariantId = selectedVariantId[selectedGroupForModal.groupKey];
                const currentVariant = selectedGroupForModal.variants.find(v => v.product_id === currentVariantId) || selectedGroupForModal.variants[0];

                return (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="text-3xl font-black text-indigo-600">${currentVariant.price}</div>
                      <span className={`saas-badge ${currentVariant.stock_quantity < 10 ? "saas-badge-warning" : "saas-badge-success"}`}>
                        {currentVariant.stock_quantity} available
                      </span>
                    </div>

                    <div className="space-y-6 mb-8">
                      <div>
                        <label className="text-xs font-bold uppercase text-slate-400 block mb-3">Select Variant</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedGroupForModal.variants.map((v) => {
                            return (
                              <button
                                key={v.product_id}
                                type="button"
                                onClick={() => setSelectedVariantId(prev => ({ ...prev, [selectedGroupForModal.groupKey]: v.product_id }))}
                                className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${
                                  currentVariantId === v.product_id 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"
                                }`}
                              >
                                {v.size || `v${v.product_id}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-400 block mb-3">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            max={currentVariant.stock_quantity}
                            value={qtyByProduct[currentVariant.product_id] || 1}
                            onChange={(e) =>
                              setQtyByProduct(prev => ({
                                ...prev,
                                [currentVariant.product_id]: Math.max(1, Number(e.target.value)),
                              }))
                            }
                            className="saas-input w-full py-2.5 text-center text-lg font-bold"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                           <p className="text-[10px] text-slate-400 font-medium mb-3">SKU: {currentVariant.sku}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => void addToCart(currentVariant.product_id)}
                      disabled={addingProductId === currentVariant.product_id || currentVariant.stock_quantity === 0}
                      className="saas-button-primary w-full py-4 text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                    >
                      {addingProductId === currentVariant.product_id ? (
                        <>
                          <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding to Cart...
                        </>
                      ) : currentVariant.stock_quantity === 0 ? "Currently Out of Stock" : (
                        <>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Add to Shopping Cart
                        </>
                      )}
                    </button>
                    
                    <p className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                       <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040L3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622l-1.382-3.016z" />
                       </svg>
                       Secure Checkout & Money Back Guarantee
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2 pointer-events-none">
        {message && (
          <div className="pointer-events-auto saas-card bg-indigo-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <svg className="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="pointer-events-auto saas-card bg-rose-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <svg className="h-5 w-5 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError("")} className="ml-2 text-rose-200 hover:text-white transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
