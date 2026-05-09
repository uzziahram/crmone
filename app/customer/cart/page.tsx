"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";
import { getActiveCustomerId } from "@/lib/active-customer";

type CartItem = {
  cart_item_id: number;
  product_id: number;
  quantity: number;
  product?: {
    product_name: string;
    price: number;
    sku: string;
  };
};

type CustomerProfile = {
  customer_id: number;
  full_name: string;
  cart_items?: CartItem[];
};

export default function CustomerCartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [qtyByItem, setQtyByItem] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingItemId, setActionLoadingItemId] = useState<number | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadCart() {
    setLoading(true);
    setError("");
    try {
      const activeId = getActiveCustomerId();
      if (!activeId) {
        setLoading(false);
        return;
      }
      const data = await apiRequest<CustomerProfile>(`/api/customer/${activeId}`);
      setCustomer(data);
      const nextQtyByItem = (data.cart_items ?? []).reduce<Record<number, number>>(
        (acc, item) => {
          acc[item.cart_item_id] = item.quantity;
          return acc;
        },
        {}
      );
      setQtyByItem(nextQtyByItem);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    void loadCart();
  }, []);

  async function updateCartItem(cartItemId: number) {
    const quantity = qtyByItem[cartItemId] ?? 1;
    setError("");
    setActionLoadingItemId(cartItemId);
    try {
      await apiRequest<{ message: string }>("/api/products/addToCart", {
        method: "PUT",
        body: JSON.stringify({ cart_item_id: cartItemId, quantity }),
      });
      await loadCart();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Failed to update item");
    } finally {
      setActionLoadingItemId(null);
    }
  }

  async function deleteCartItem(cartItemId: number) {
    setError("");
    setActionLoadingItemId(cartItemId);
    try {
      await apiRequest<{ message: string }>("/api/products/addToCart", {
        method: "DELETE",
        body: JSON.stringify({ cart_item_id: cartItemId }),
      });
      await loadCart();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Failed to delete item");
    } finally {
      setActionLoadingItemId(null);
    }
  }

  async function handleCheckout() {
    if (!customer?.customer_id) return;
    
    setIsCheckingOut(true);
    setError("");
    try {
      await apiRequest("/api/products/addToOrder", {
        method: "POST",
        body: JSON.stringify({ customer_id: customer.customer_id }),
      });
      
      setSuccessMessage("Order placed successfully! Redirecting...");
      setTimeout(() => {
        router.push("/customer");
        router.refresh();
      }, 2000);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed. Please try again.");
      setIsCheckingOut(false);
    }
  }

  const total = useMemo(
    () =>
      (customer?.cart_items ?? []).reduce(
        (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
        0
      ),
    [customer]
  );

  // Prevent hydration mismatch by only rendering client-specific parts after mounting
  if (!mounted) {
    return <AppShell title="Your Shopping Cart"><div className="animate-pulse saas-card p-12 text-center text-slate-400">Loading your cart...</div></AppShell>;
  }

  return (
    <AppShell title="Your Shopping Cart">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="saas-card p-8 text-center animate-pulse">
              <div className="h-6 w-1/3 bg-slate-100 rounded mx-auto mb-4"></div>
              <div className="h-4 w-2/3 bg-slate-100 rounded mx-auto"></div>
            </div>
          ) : !customer ? (
            <div className="saas-card p-8 text-center">
              <p className="text-slate-500 italic">No active customer session found.</p>
            </div>
          ) : (customer.cart_items?.length ?? 0) === 0 ? (
            <div className="saas-card p-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl">
                  🛒
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
              <p className="text-slate-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
              <Link href="/customer" className="saas-button-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="saas-card overflow-hidden">
              <div className="divide-y divide-slate-100">
                {customer.cart_items?.map((item) => (
                  <div key={item.cart_item_id} className="p-6 flex items-start justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                        {item.product?.sku}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {item.product?.product_name || `Product ${item.product_id}`}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        ${item.product?.price ?? 0} per unit
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={qtyByItem[item.cart_item_id] ?? item.quantity}
                          onChange={(e) =>
                            setQtyByItem((prev) => ({
                              ...prev,
                              [item.cart_item_id]: Math.max(1, Number(e.target.value)),
                            }))
                          }
                          className="saas-input w-20 py-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void updateCartItem(item.cart_item_id)}
                          disabled={actionLoadingItemId === item.cart_item_id || qtyByItem[item.cart_item_id] === item.quantity}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Update
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          onClick={() => void deleteCartItem(item.cart_item_id)}
                          disabled={actionLoadingItemId === item.cart_item_id}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="saas-card p-8 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">${total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="font-medium text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-900">$0.00</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-xl font-black text-indigo-600">${total}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={!customer?.cart_items?.length || isCheckingOut}
              className="saas-button-primary w-full py-3 text-base shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </button>
            
            <Link 
              href="/customer" 
              className="mt-4 saas-button-secondary w-full"
            >
              Continue Shopping
            </Link>

            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billing for</p>
              <p className="text-sm font-bold text-slate-900">{customer?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{customer?.customer_id ? `Member ID: #${customer.customer_id}` : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {successMessage && (
          <div className="pointer-events-auto saas-card bg-indigo-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <svg className="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium">{successMessage}</p>
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
