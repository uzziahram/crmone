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
    image_url?: string;
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
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const paymentOptions = [
    { id: "cod", label: "Cash on Delivery", icon: "💵", description: "Pay when you receive the items" },
    { id: "gcash", label: "GCash", icon: "🔵", group: "E-wallet" },
    { id: "paypal", label: "PayPal", icon: "🅿️", group: "E-wallet" },
    { id: "maya", label: "Maya", icon: "🟢", group: "E-wallet" },
    { id: "gotyme", label: "GoTyme", icon: "🟡", group: "E-wallet" },
    { id: "card", label: "Debit or Credit Card", icon: "💳", description: "Visa, Mastercard, etc." },
  ];

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
    if (!paymentMethod) {
      setError("Please select a payment method.");
      return;
    }
    
    setIsCheckingOut(true);
    setError("");
    try {
      await apiRequest("/api/products/addToOrder", {
        method: "POST",
        body: JSON.stringify({ 
          customer_id: customer.customer_id,
          payment_method: paymentMethod
        }),
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
                  <div key={item.cart_item_id} className="p-6 flex items-start gap-6 hover:bg-slate-50/50 transition-colors">
                    <div className="h-24 w-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100">
                      {item.product?.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.product_name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-200 text-3xl">👕</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                        {item.product?.sku}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
                        {item.product?.product_name || `Product ${item.product_id}`}
                      </h3>
                      <p className="text-slate-500 text-sm mb-4">
                        ${item.product?.price ?? 0} per unit
                      </p>

                      <div className="flex items-center gap-6">
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
                            className="saas-input w-20 py-1 text-center font-bold"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => void updateCartItem(item.cart_item_id)}
                            disabled={actionLoadingItemId === item.cart_item_id || qtyByItem[item.cart_item_id] === item.quantity}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 transition-colors"
                          >
                            Update
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => void deleteCartItem(item.cart_item_id)}
                            disabled={actionLoadingItemId === item.cart_item_id}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-30 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-slate-400 mb-1">Subtotal</p>
                      <p className="text-lg font-black text-slate-900">
                        ${((item.product?.price ?? 0) * (qtyByItem[item.cart_item_id] ?? item.quantity)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="saas-card p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Payment Method</h3>
            <div className="space-y-3">
              {paymentOptions.map((opt) => (
                <label 
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === opt.id 
                      ? "border-indigo-600 bg-indigo-50/50" 
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.id}
                    checked={paymentMethod === opt.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                    {opt.group && <p className="text-[10px] font-bold text-indigo-500 uppercase">{opt.group}</p>}
                    {opt.description && <p className="text-[10px] text-slate-500">{opt.description}</p>}
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === opt.id ? "border-indigo-600" : "border-slate-200"
                  }`}>
                    {paymentMethod === opt.id && <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="saas-card p-8 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">${total.toFixed(2)}</span>
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
                <span className="text-xl font-black text-indigo-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={!customer?.cart_items?.length || isCheckingOut || !paymentMethod}
              className="saas-button-primary w-full py-3 text-base shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCheckingOut ? "Processing..." : "Place Order"}
            </button>
            
            <Link 
              href="/customer" 
              className="mt-4 saas-button-secondary w-full"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {successMessage && (
          <div className="pointer-events-auto saas-card bg-indigo-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="pointer-events-auto saas-card bg-rose-600 text-white border-none p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
