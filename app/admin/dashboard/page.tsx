"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";

type Customer = {
  customer_id: number;
  full_name: string;
  email: string;
  contact_number?: string;
  address?: string;
  created_at?: string;
  orders?: Array<{
    order_id: number;
    order_date: string;
    total_amount: number;
    status: string;
  }>;
  cart_items?: Array<{
    cart_item_id: number;
    product_id: number;
    quantity: number;
    product?: {
      product_name: string;
      sku: string;
      price: number;
      size?: string;
    };
  }>;
};

type Product = {
  product_id: number;
  product_name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_alert: number;
  category?: string;
  image_url?: string;
  size?: string;
};

type Order = {
  order_id: number;
  customer_id: number;
  status: string;
  payment_method?: string;
  total_amount: number;
  full_name: string;
  email: string;
  items: Array<{
    order_item_id: number;
    product_name: string;
    quantity: number;
    rating?: number;
    comments?: string;
    size?: string;
  }>;
};

type Review = {
  order_item_id: number;
  order_id: number;
  customer_name: string;
  product_name: string;
  rating?: number;
  comments?: string;
};

type ReportData = {
  summary: { total_sales: number; total_cost: number; total_profit: number };
  ratings: Array<{ rating: number; count: number }>;
  topProducts: Array<{ product_name: string; total_quantity: number; product_profit: number }>;
  trends: Array<{ month: string; sales: number; cost: number; profit: number }>;
  highestRatedProducts: Array<{ product_name: string; avg_rating: number; rating_count: number }>;
};

type BusinessProfile = {
  company_name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  tax_id: string;
  currency: string;
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  
  // Detailed Customer View State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  
  // Product Editing State
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Search States
  const [inventorySearch, setInventorySearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [satisfactionSearch, setSatisfactionSearch] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [customerData, orderData, productData, reviewData, reportData, profileData] = await Promise.all([
        apiRequest<Customer[]>("/api/customer/getAllMembers"),
        apiRequest<Order[]>("/api/orders"),
        apiRequest<Product[]>("/api/products"),
        apiRequest<Review[]>("/api/reviews"),
        apiRequest<ReportData>("/api/admin/reports"),
        apiRequest<BusinessProfile>("/api/admin/business-profile")
      ]);
      setCustomers(customerData);
      setOrders(orderData);
      setProducts(productData);
      setReviews(reviewData);
      setReport(reportData);
      setProfile(profileData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  // Filtered Lists
  const filteredProducts = useMemo(() => 
    products.filter(p => p.product_name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.sku.toLowerCase().includes(inventorySearch.toLowerCase())),
  [products, inventorySearch]);

  const filteredCustomers = useMemo(() => 
    customers.filter(c => c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase())),
  [customers, customerSearch]);

  const filteredOrders = useMemo(() => 
    orders.filter(o => o.full_name.toLowerCase().includes(orderSearch.toLowerCase()) || o.order_id.toString().includes(orderSearch)),
  [orders, orderSearch]);

  const filteredReviews = useMemo(() =>
    reviews.filter(r => 
      r.customer_name.toLowerCase().includes(satisfactionSearch.toLowerCase()) || 
      r.product_name.toLowerCase().includes(satisfactionSearch.toLowerCase()) ||
      (r.comments || "").toLowerCase().includes(satisfactionSearch.toLowerCase())
    ),
  [reviews, satisfactionSearch]);

  async function viewCustomerProfile(customerId: number) {
    setLoadingCustomer(true);
    setSelectedCustomer(null);
    try {
      const data = await apiRequest<Customer>(`/api/customer/${customerId}`);
      setSelectedCustomer(data);
    } catch (err) {
      setError("Failed to load customer profile");
    } finally {
      setLoadingCustomer(false);
    }
  }

  async function updateOrderStatus(orderId: number, status: string) {
    try {
      await apiRequest(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, by_admin: true }),
      });
      setMessage(`Order #${orderId} updated to ${status}.`);
      setTimeout(() => setMessage(""), 3000);
      await loadAll();
    } catch (err) { setError("Failed to update order"); }
  }

  async function updateStock(event: FormEvent<HTMLFormElement>, productId: number) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const updates: any = {
        stock_quantity: Number(formData.get("stock_quantity")),
        low_stock_alert: Number(formData.get("low_stock_alert")),
      };
      
      const product_name = formData.get("product_name");
      const price = formData.get("price");
      
      if (product_name) updates.product_name = String(product_name);
      if (price) updates.price = Number(price);

      const endpoint = editingProductId === productId 
        ? `/api/products/${productId}` 
        : `/api/products/${productId}/stock`;

      await apiRequest(endpoint, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setMessage("Product updated successfully.");
      setEditingProductId(null);
      setTimeout(() => setMessage(""), 3000);
      await loadAll();
    } catch (err) { setError("Product update failed"); }
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    
    let created = false;
    try {
      await apiRequest("/api/products", {
        method: "POST",
        body: formData,
      });
      created = true;
      event.currentTarget.reset();
      setMessage("Product created successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { 
      setError(err instanceof Error ? err.message : "Failed to create product"); 
    }

    if (created) {
      try {
        await loadAll();
      } catch (err) {
        console.error("Failed to refresh list after creation", err);
      }
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/admin/business-profile", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      setMessage("Profile updated.");
      setTimeout(() => setMessage(""), 3000);
      await loadAll();
    } catch (err) { setError("Failed to update profile"); }
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "satisfaction", label: "Satisfaction", icon: "⭐" },
    { id: "reports", label: "Reports & Profit", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <AppShell title={profile?.company_name || "Admin Portal"}>
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedCustomer(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="saas-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-2xl shadow-lg">👤</div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customers</p>
                <p className="text-2xl font-black text-slate-900">{customers.length}</p>
              </div>
            </div>
            <div className="saas-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-500 flex items-center justify-center text-2xl shadow-lg">📦</div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Orders</p>
                <p className="text-2xl font-black text-slate-900">{orders.length}</p>
              </div>
            </div>
            <div className="saas-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-2xl shadow-lg">💰</div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sales</p>
                <p className="text-2xl font-black text-slate-900">${report?.summary?.total_sales?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="saas-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-2xl shadow-lg">✨</div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profit</p>
                <p className="text-2xl font-black text-emerald-600">${report?.summary?.total_profit?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <div className="saas-card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                <button onClick={() => setActiveTab("reports")} className="text-xs font-bold text-indigo-600 uppercase">View All</button>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold">#{order.order_id}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{order.full_name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {order.items.slice(0, 2).map((item, i) => (
                              <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded-sm">
                                {item.product_name} {item.size && `(${item.size})`}
                              </span>
                            ))}
                            {order.items.length > 2 && <span className="text-[9px] text-slate-400">+{order.items.length - 2} more</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`saas-badge ${order.status === 'delivered' ? 'saas-badge-success' : 'saas-badge-info'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {order.payment_method || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">${order.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Ratings */}
            <div className="saas-card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Customer Satisfaction</h3>
              </div>
              <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
                {reviews.slice(0, 4).map((review) => (
                  <div key={review.order_item_id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-bold text-slate-900">{review.customer_name}</p>
                      <div className="flex text-amber-400 text-xs">
                        {[...Array(5)].map((_, i) => <span key={i}>{i < (review.rating || 0) ? "★" : "☆"}</span>)}
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">{review.product_name}</p>
                    <p className="text-xs text-slate-500 italic">"{review.comments || "No comment."}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-8">
          <section className="saas-card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Add New Product</h3>
            <form onSubmit={addProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                <input required name="product_name" className="saas-input" placeholder="e.g. Premium Coffee" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">SKU</label>
                <input required name="sku" className="saas-input" placeholder="SKU-001" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                <input name="category" className="saas-input" placeholder="Beverages" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Size (Optional)</label>
                <input name="size" className="saas-input" placeholder="M, 1L, etc." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sale Price</label>
                <input required name="price" type="number" step="0.01" className="saas-input" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Investment Price (Buying)</label>
                <input required name="cost_price" type="number" step="0.01" className="saas-input" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Qty</label>
                <input required name="stock_quantity" type="number" className="saas-input" placeholder="0" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Low Stock Alert</label>
                <input name="low_stock_alert" type="number" className="saas-input" placeholder="5" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Product Photo</label>
                <input name="image" type="file" accept="image/*" className="saas-input py-1.5 text-[10px]" />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <button type="submit" className="saas-button-primary w-full py-2">Create Product</button>
              </div>
            </form>
          </section>

          {/* Inventory Search */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search inventory by name or SKU..." 
              className="saas-input pl-12 py-4 text-lg shadow-sm"
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.product_id} className="saas-card flex flex-col group overflow-hidden">
                {/* Portrait Image Container */}
                <div className="relative aspect-[3/4] w-full bg-slate-50 overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.product_name} 
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-200 text-6xl">
                      👕
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-2">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{product.sku}</span>
                      {editingProductId === product.product_id ? (
                        <input 
                          name="product_name" 
                          form={`form-${product.product_id}`}
                          defaultValue={product.product_name} 
                          className="saas-input text-lg font-bold py-1 mt-1" 
                        />
                      ) : (
                        <h4 className="text-lg font-bold text-slate-900">{product.product_name}</h4>
                      )}
                      {product.size && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Size: {product.size}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {editingProductId === product.product_id ? (
                        <input 
                          name="price" 
                          type="number"
                          step="0.01"
                          form={`form-${product.product_id}`}
                          defaultValue={product.price} 
                          className="saas-input text-lg font-black py-1 w-24 text-right" 
                        />
                      ) : (
                        <p className="text-lg font-black text-slate-900">${product.price}</p>
                      )}
                      <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        Profit: ${(product.price - product.cost_price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <form 
                      id={`form-${product.product_id}`}
                      onSubmit={(e) => updateStock(e, product.product_id)} 
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">In Stock</label>
                          <input name="stock_quantity" type="number" defaultValue={product.stock_quantity} className="saas-input text-xs py-1" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Alert At</label>
                          <input name="low_stock_alert" type="number" defaultValue={product.low_stock_alert} className="saas-input text-xs py-1" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {editingProductId === product.product_id ? (
                          <>
                            <button type="submit" className="saas-button-primary flex-1 py-1 text-xs">Save Changes</button>
                            <button 
                              type="button" 
                              onClick={() => setEditingProductId(null)} 
                              className="saas-button-secondary flex-1 py-1 text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="submit" className="saas-button-secondary flex-1 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Update Stock</button>
                            <button 
                              type="button" 
                              onClick={() => setEditingProductId(product.product_id)} 
                              className="saas-button-secondary flex-1 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Edit Details
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                    {product.stock_quantity <= product.low_stock_alert && (
                      <div className="mt-4 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase rounded-lg text-center animate-pulse">Low Stock Warning</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "customers" && (
        <div className="space-y-6">
          {selectedCustomer ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
              >
                ← Back to Customer List
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Detail Card */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="saas-card p-8 text-center">
                    <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-black mx-auto mb-4 shadow-xl shadow-indigo-100">
                      {selectedCustomer.full_name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedCustomer.full_name}</h3>
                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6">Customer ID: #{selectedCustomer.customer_id}</p>
                    
                    <div className="space-y-4 text-left pt-6 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                        <p className="text-sm font-medium text-slate-900">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                        <p className="text-sm font-medium text-slate-900">{selectedCustomer.contact_number || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Physical Address</p>
                        <p className="text-sm font-medium text-slate-900">{selectedCustomer.address || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Member Since</p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cart Overview */}
                  <div className="saas-card p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Cart Items</h4>
                    {!selectedCustomer.cart_items?.length ? (
                      <p className="text-sm text-slate-400 italic text-center py-4">Cart is currently empty.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedCustomer.cart_items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{item.product?.product_name}</span>
                              {item.product?.size && <span className="text-[10px] text-slate-400">Size: {item.product.size}</span>}
                            </div>
                            <span className="text-slate-500">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order History */}
                <div className="lg:col-span-2">
                  <div className="saas-card overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                      <h3 className="text-lg font-bold text-slate-900">Order History</h3>
                    </div>
                    {!selectedCustomer.orders?.length ? (
                      <div className="p-12 text-center text-slate-400 italic">No orders found for this customer.</div>
                    ) : (
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest"><tr>
                              <th className="px-6 py-3">Order ID</th>
                              <th className="px-6 py-3">Date</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedCustomer.orders.map((order) => (
                              <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">#{order.order_id}</td>
                                <td className="px-6 py-4 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                  <span className={`saas-badge ${order.status === 'delivered' ? 'saas-badge-success' : 'saas-badge-info'}`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-900">${order.total_amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search customers by name or email..." 
                  className="saas-input pl-12 py-3 text-base shadow-sm"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <div className="saas-card overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
                  <h3 className="text-xl font-bold text-slate-900">Registered Customers</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-base">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-widest"><tr>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4 text-right">ID</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map((c) => (
                        <tr key={c.customer_id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{c.full_name}</td>
                          <td className="px-6 py-4 text-slate-600">{c.email}</td>
                          <td className="px-6 py-4 text-right text-slate-400">#{c.customer_id}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => viewCustomerProfile(c.customer_id)}
                              disabled={loadingCustomer}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                            >
                              {loadingCustomer ? "..." : "View Profile"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "satisfaction" && (
        <div className="space-y-8">
          {/* Satisfaction Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="saas-card p-8 text-center flex flex-col items-center justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Average Rating</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-slate-900">{averageRating}</span>
                <div className="text-amber-400 text-2xl flex">
                  {[...Array(5)].map((_, i) => <span key={i}>{i < Math.round(Number(averageRating)) ? "★" : "☆"}</span>)}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 italic">Based on {reviews.length} customer reviews</p>
            </div>
            
            <div className="saas-card p-6 sm:col-span-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Rating Distribution</h4>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const rating = report?.ratings.find(r => r.rating === star);
                  const totalRatings = report?.ratings.reduce((acc, curr) => acc + curr.count, 0) || 1;
                  const percent = rating ? (rating.count / totalRatings) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-500 w-8">{star} ★</span>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 w-16 text-right">{rating?.count || 0} reviews</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Top Rated Products */}
             <div className="lg:col-span-1 space-y-6">
                <div className="saas-card overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">Top Rated Products</h3>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-slate-100">
                        {report?.highestRatedProducts.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{p.product_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-amber-400 text-xs">★</span>
                                <span className="text-xs font-black text-slate-600">{Number(p.avg_rating).toFixed(1)}</span>
                                <span className="text-[10px] text-slate-400">({p.rating_count} rev.)</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="saas-card p-6 bg-indigo-50 border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Admin Tip</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Customer feedback is essential for inventory optimization. Consider increasing stock for products with 4.5+ ratings and running promotions for those with comments about price sensitivity.
                  </p>
                </div>
             </div>

             {/* All Reviews Feed */}
             <div className="lg:col-span-2 space-y-6">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search reviews by customer, product or comment..." 
                    className="saas-input pl-12 py-3 text-base shadow-sm"
                    value={satisfactionSearch}
                    onChange={(e) => setSatisfactionSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  {filteredReviews.length === 0 ? (
                    <div className="saas-card p-12 text-center text-slate-400 italic">No reviews found matching your search.</div>
                  ) : (
                    filteredReviews.map((review) => (
                      <div key={review.order_item_id} className="saas-card p-6 hover:border-indigo-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm font-black text-slate-900">{review.customer_name}</p>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{review.product_name}</p>
                          </div>
                          <div className="flex text-amber-400 text-sm">
                            {[...Array(5)].map((_, i) => <span key={i}>{i < (review.rating || 0) ? "★" : "☆"}</span>)}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-sm text-slate-600 italic">"{review.comments || "The customer did not leave a comment."}"</p>
                        </div>
                        <div className="mt-4 flex justify-end">
                           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Order Ref: #{review.order_id}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-8">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search orders by customer or ID..." 
              className="saas-input pl-12 py-3 text-base shadow-sm"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
          </div>

          {/* Performance Report Section */}
          <section className="saas-card p-8">
            <h3 className="text-xl font-black text-slate-900 mb-8">Performance Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Gross Sales</p>
                <p className="text-3xl font-black text-slate-900">${report?.summary?.total_sales?.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-2">Revenue from all processed orders</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cost of Goods Sold</p>
                <p className="text-3xl font-black text-slate-900">${report?.summary?.total_cost?.toLocaleString()}</p>
                <p className="text-[10px] text-rose-500 font-bold mt-2">Inventory investment</p>
              </div>
              <div className="p-6 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 text-white">
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Net Profit</p>
                <p className="text-3xl font-black">${report?.summary?.total_profit?.toLocaleString()}</p>
                <div className="mt-2 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${(report?.summary?.total_profit! / (report?.summary?.total_sales! || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Monthly Financial Performance */}
            <div className="mb-12">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Monthly Financial Performance</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="px-6 py-3">Month</th>
                      <th className="px-6 py-3">Gross Income</th>
                      <th className="px-6 py-3">Investment (Cost)</th>
                      <th className="px-6 py-3">Net Profit</th>
                      <th className="px-6 py-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report?.trends.map((month) => {
                      const margin = (month.profit / (month.sales || 1)) * 100;
                      return (
                        <tr key={month.month} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{month.month}</td>
                          <td className="px-6 py-4 text-emerald-600 font-medium">${month.sales.toLocaleString()}</td>
                          <td className="px-6 py-4 text-rose-500 font-medium">${month.cost.toLocaleString()}</td>
                          <td className="px-6 py-4 font-black text-slate-900">${month.profit.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${margin > 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-12">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Full Order History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-base">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-widest"><tr>
                      <th className="px-6 py-5">Order</th>
                      <th className="px-6 py-5">Customer</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5">Payment</th>
                      <th className="px-6 py-5 text-right">Total</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.order_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">#{o.order_id}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{o.full_name}</p>
                          <p className="text-[10px] text-slate-400 mb-2">{o.email}</p>
                          <div className="space-y-1">
                            {o.items.map((item, i) => (
                              <div key={i} className="text-[10px] flex items-center gap-1">
                                <span className="bg-slate-100 text-slate-600 px-1 rounded font-bold">x{item.quantity}</span>
                                <span className="text-slate-500 font-medium">{item.product_name}</span>
                                {item.size && <span className="text-indigo-500 font-bold bg-indigo-50 px-1 rounded">{item.size}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`saas-badge ${o.status === 'delivered' ? 'saas-badge-success' : 'saas-badge-info'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {o.payment_method || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">${o.total_amount}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {["processing", "shipped", "delivered"].map((status) => (
                              <button
                                key={status}
                                disabled={o.status === status}
                                onClick={() => void updateOrderStatus(o.order_id, status)}
                                className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                  o.status === status 
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                    : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-slate-100">
              {/* Top Products */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Top Performing Products (Volume)</h4>
                <div className="space-y-4">
                  {report?.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.total_quantity} Units Sold</p>
                      </div>
                      <p className="text-sm font-black text-emerald-600">+${p.product_profit.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Satisfaction Summary Mini */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Quick Rating Snapshot</h4>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const rating = report?.ratings.find(r => r.rating === star);
                    const totalRatings = report?.ratings.reduce((acc, curr) => acc + curr.count, 0) || 1;
                    const percent = rating ? (rating.count / totalRatings) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-500 w-8">{star} ★</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 w-12 text-right">{rating?.count || 0} rev.</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setActiveTab("satisfaction")} className="mt-8 text-xs font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700">View Detailed Satisfaction Report →</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto">
          <section className="saas-card p-8">
            <h3 className="text-xl font-black text-slate-900 mb-8">Business Profile</h3>
            <form onSubmit={updateProfile} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Company Name</label>
                <input required name="company_name" defaultValue={profile?.company_name} className="saas-input" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Physical Address</label>
                <textarea name="address" defaultValue={profile?.address} rows={3} className="saas-input" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Contact Email</label>
                  <input type="email" name="contact_email" defaultValue={profile?.contact_email} className="saas-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Contact Phone</label>
                  <input name="contact_phone" defaultValue={profile?.contact_phone} className="saas-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Tax ID / VAT</label>
                  <input name="tax_id" defaultValue={profile?.tax_id} className="saas-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
                  <select name="currency" defaultValue={profile?.currency} className="saas-input">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="saas-button-primary w-full py-3 shadow-lg shadow-indigo-100">
                Save Profile Changes
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {message && (
          <div className="pointer-events-auto saas-card bg-indigo-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <svg className="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="pointer-events-auto saas-card bg-rose-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <svg className="h-5 w-5 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
