"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";
import {
  getActiveCustomerId,
  setActiveCustomerId,
} from "@/lib/active-customer";

type Product = {
  product_id: number;
  product_name: string;
  sku: string;
  category?: string;
  size?: string;
  price: number;
  stock_quantity: number;
  low_stock_alert: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCustomerId, setActiveCustomerState] = useState<number | null>(
    null
  );
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<Product[]>("/api/products");
      setProducts(data);
      setActiveCustomerState(getActiveCustomerId());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function addNewProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    const formData = new FormData(event.currentTarget);

    try {
      await apiRequest<{ message: string }>("/api/products", {
        method: "POST",
        body: JSON.stringify({
          product_name: String(formData.get("product_name") ?? ""),
          sku: String(formData.get("sku") ?? ""),
          category: String(formData.get("category") ?? ""),
          size: String(formData.get("size") ?? ""),
          price: Number(formData.get("price") ?? 0),
          stock_quantity: Number(formData.get("stock_quantity") ?? 0),
          low_stock_alert: Number(formData.get("low_stock_alert") ?? 0),
        }),
      });
      event.currentTarget.reset();
      setStatus("Product created successfully.");
      setTimeout(() => setStatus(""), 3000);
      await loadProducts();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create product"
      );
    }
  }

  async function addToCart(productId: number) {
    if (!activeCustomerId) {
      setError("Please set an active customer ID first.");
      return;
    }

    setError("");
    setStatus("");
    setAddingItemId(productId);

    try {
      await apiRequest<{ message: string }>("/api/products/addToCart", {
        method: "POST",
        body: JSON.stringify({
          customer_id: activeCustomerId,
          product_id: productId,
          quantity: 1,
        }),
      });
      setStatus("Item added to cart.");
      setTimeout(() => setStatus(""), 3000);
    } catch (cartError) {
      setError(cartError instanceof Error ? cartError.message : "Failed to add to cart");
    } finally {
      setAddingItemId(null);
    }
  }

  async function checkoutCart() {
    if (!activeCustomerId) {
      setError("Please set an active customer ID first.");
      return;
    }

    setError("");
    setStatus("");

    try {
      const result = await apiRequest<{
        message: string;
        orderId: number;
        totalAmount: number;
      }>("/api/products/addToOrder", {
        method: "POST",
        body: JSON.stringify({ customer_id: activeCustomerId }),
      });
      setStatus(`Order #${result.orderId} successfully placed for $${result.totalAmount}`);
      await loadProducts();
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Checkout failed");
    }
  }

  return (
    <AppShell title="Product & Transaction Management">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Management Tools */}
        <div className="lg:col-span-1 space-y-8">
          {/* Active Context Card */}
          <section className="saas-card p-6 border-indigo-100 bg-indigo-50/50">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Transaction Context</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Active Customer ID</label>
                <input
                  type="number"
                  defaultValue={activeCustomerId ?? ""}
                  placeholder="Enter ID"
                  className="saas-input"
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value > 0) {
                      setActiveCustomerId(value);
                      setActiveCustomerState(value);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => void checkoutCart()}
                disabled={!activeCustomerId}
                className="saas-button-primary w-full py-2.5 shadow-lg shadow-indigo-100"
              >
                Checkout Current Cart
              </button>
              <p className="text-[10px] text-center text-slate-400 font-medium italic">
                Simulate a checkout for any customer by setting their ID here.
              </p>
            </div>
          </section>

          {/* Create Product Card */}
          <section className="saas-card p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Add New Product</h3>
            <form onSubmit={addNewProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Product Name</label>
                <input required name="product_name" placeholder="e.g. Wireless Mouse" className="saas-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">SKU</label>
                  <input required name="sku" placeholder="MS-001" className="saas-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                  <input name="category" placeholder="Electronics" className="saas-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Price ($)</label>
                  <input required type="number" step="0.01" min="0" name="price" placeholder="0.00" className="saas-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Stock</label>
                  <input required type="number" min="0" name="stock_quantity" placeholder="100" className="saas-input" />
                </div>
              </div>
              <button type="submit" className="saas-button-secondary w-full py-2">
                Create Listing
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Catalog */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Product Catalog</h2>
            <button
              onClick={() => void loadProducts()}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 uppercase tracking-widest"
            >
              Refresh Data
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="saas-card p-6 h-40 animate-pulse bg-slate-50/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {products.map((product) => (
                <article key={product.product_id} className="saas-card p-6 flex flex-col group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                        {product.category || "Uncategorized"}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {product.product_name}
                      </h4>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">{product.sku}</p>
                    </div>
                    <div className="text-xl font-black text-slate-900">
                      ${product.price}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${product.stock_quantity > product.low_stock_alert ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      <span className="text-xs font-bold text-slate-500">{product.stock_quantity} available</span>
                    </div>
                    <button
                      onClick={() => void addToCart(product.product_id)}
                      disabled={addingItemId === product.product_id || product.stock_quantity === 0}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-widest disabled:opacity-30"
                    >
                      {addingItemId === product.product_id ? "Adding..." : "Add to Cart"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {status && (
          <div className="pointer-events-auto saas-card bg-indigo-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <svg className="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium">{status}</p>
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
