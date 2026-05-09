"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        
        // Advanced SKU Parsing: Split at last separator (- or _) or at trailing digits
        // e.g. "WS-41" -> base "WS-", variant "41"
        // e.g. "TSH-WHT-S" -> base "TSH-WHT-", variant "S"
        const skuMatch = p.sku.match(/^(.*[-_])(.*)$/) || p.sku.match(/^(.*?)(\d+)$/);
        const baseSku = skuMatch ? skuMatch[1] : p.sku;
        const groupKey = `${p.product_name.toLowerCase()}@${baseSku.toLowerCase()}`;
        
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
        // Advanced SKU Parsing for grouping
        const skuMatch = p.sku.match(/^(.*[-_])(.*)$/) || p.sku.match(/^(.*?)(\d+)$/);
        const baseSku = skuMatch ? skuMatch[1] : p.sku;
        
        // Grouping Key: Name + Base SKU ensures they are truly related variants
        const groupKey = `${p.product_name.toLowerCase()}@${baseSku.toLowerCase()}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            groupKey,
            product_name: p.product_name,
            category: p.category,
            variants: [],
            minPrice: p.price,
            maxPrice: p.price
          };
        }
        groups[groupKey].variants.push(p);
        groups[groupKey].minPrice = Math.min(groups[groupKey].minPrice, p.price);
        groups[groupKey].maxPrice = Math.max(groups[groupKey].maxPrice, p.price);
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
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar: Profile & Cart Summary */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="saas-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">My Profile</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-900 truncate">{customerProfile?.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-medium text-slate-900">{customerProfile?.contact_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Address</p>
                <p className="text-sm font-medium text-slate-900">{customerProfile?.address || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="saas-card p-6 bg-indigo-600 text-white border-none shadow-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-100">Your Cart</h3>
              <svg className="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{cartCount}</p>
                <p className="text-xs text-indigo-200">Total items in cart</p>
              </div>
              <Link href="/customer/cart" className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white/30 transition-colors">
                View Cart
              </Link>
            </div>
          </div>

          <div className="saas-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Recent Orders</h3>
            {!customerProfile?.orders?.length ? (
              <p className="text-sm text-slate-400 italic">No orders found.</p>
            ) : (
              <ul className="space-y-3">
                {customerProfile.orders.slice(0, 5).map((order) => (
                  <li key={order.order_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 group">
                    <div>
                      <Link href={`/customer/orders/${order.order_id}`} className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                        Order #{order.order_id}
                      </Link>
                      <p className="text-[10px] text-slate-400">{new Date(order.order_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`saas-badge ${order.status === "completed" || order.status === "delivered" ? "saas-badge-success" : "saas-badge-info"}`}>
                        {order.status}
                      </span>
                      <Link href={`/customer/orders/${order.order_id}`} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main Content: Product Catalog */}
        <main className="lg:col-span-3 space-y-6">
          {/* Search & Filters */}
          <div className="saas-card p-4 flex flex-col md:flex-row gap-4 items-center">
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

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Product Catalog</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {filteredGroupedProducts.length} unique products
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="saas-card p-6 animate-pulse">
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
            <div className="grid gap-6 md:grid-cols-2">
              {filteredGroupedProducts.map((group) => {
                const currentVariantId = selectedVariantId[group.groupKey];
                const currentVariant = group.variants.find(v => v.product_id === currentVariantId) || group.variants[0];

                return (
                  <article key={group.groupKey} className="saas-card flex flex-col p-6 overflow-hidden group">
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
                    
                    <p className="text-xs text-slate-500 mb-6">
                      SKU: {currentVariant.sku} · <span className={currentVariant.stock_quantity < 10 ? "text-amber-600 font-medium" : "text-slate-400"}>
                        {currentVariant.stock_quantity} in stock
                      </span>
                    </p>

                    {/* Variant Selector */}
                    {group.variants.length > 1 && (
                      <div className="mb-6">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Select Variant</label>
                        <div className="flex flex-wrap gap-2">
                          {group.variants.map((v) => {
                            // Extract variant label from SKU (e.g. "S" from "TSH-WHT-S" or "41" from "WS-41")
                            const skuVariantMatch = v.sku.match(/^(.*[-_])(.*)$/) || v.sku.match(/^(.*?)(\d+)$/);
                            const variantLabel = skuVariantMatch ? skuVariantMatch[2] : v.sku;

                            return (
                              <button
                                key={v.product_id}
                                onClick={() => setSelectedVariantId(prev => ({ ...prev, [group.groupKey]: v.product_id }))}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentVariantId === v.product_id 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"
                                }`}
                              >
                                {v.size || variantLabel || `v${v.product_id}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Qty</label>
                        <input
                          type="number"
                          min={1}
                          max={currentVariant.stock_quantity}
                          value={qtyByProduct[currentVariant.product_id] ?? 1}
                          onChange={(e) =>
                            setQtyByProduct((prev) => ({
                              ...prev,
                              [currentVariant.product_id]: Math.max(1, Number(e.target.value)),
                            }))
                          }
                          className="saas-input py-1 px-2 w-16 text-center"
                        />
                      </div>
                      <button
                        onClick={() => void addToCart(currentVariant.product_id)}
                        disabled={addingProductId === currentVariant.product_id || currentVariant.stock_quantity === 0}
                        className="saas-button-primary flex-[2] py-2"
                      >
                        {addingProductId === currentVariant.product_id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </span>
                        ) : currentVariant.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
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
