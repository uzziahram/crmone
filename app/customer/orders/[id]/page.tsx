"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";

type OrderItem = {
  order_item_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  category?: string;
  size?: string;
  quantity: number;
  price_at_purchase: number;
  rating?: number;
  comments?: string;
};

type OrderDetails = {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  full_name: string;
  email: string;
  items: OrderItem[];
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [reviewingItemId, setReviewingItemId] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchOrder() {
    try {
      const data = await apiRequest<OrderDetails>(`/api/orders/${params.id}`);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    if (params.id) {
      void fetchOrder();
    }
  }, [params.id]);

  async function submitReview(productId: number, rating: number, comments: string) {
    if (!order) return;
    setSubmittingReview(true);
    setError("");
    try {
      await apiRequest(`/api/orders/${order.order_id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          customer_id: order.customer_id,
          product_id: productId,
          rating,
          comments
        })
      });
      setSuccessMessage("Thank you for your review!");
      setReviewingItemId(null);
      await fetchOrder();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (!mounted) return null;

  return (
    <AppShell title={`Order #${params.id}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link 
          href="/customer" 
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors uppercase tracking-widest"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {loading ? (
          <div className="saas-card p-12 text-center animate-pulse">
            <div className="h-8 w-1/4 bg-slate-100 rounded mx-auto mb-4"></div>
            <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
          </div>
        ) : error && !order ? (
          <div className="saas-card bg-rose-50 border-rose-100 p-8 text-center">
            <div className="mb-4 flex justify-center text-rose-600">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link href="/customer" className="saas-button-primary">Return to Store</Link>
          </div>
        ) : order ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Order Status & Header */}
            <section className="saas-card p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`saas-badge ${
                      order.status === 'delivered' ? 'saas-badge-success' : 
                      order.status === 'pending' ? 'saas-badge-warning' : 'saas-badge-info'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(order.order_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Order #{order.order_id}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-4xl font-black text-indigo-600">${order.total_amount}</p>
                </div>
              </div>
            </section>

            {/* Order Items & Review Section */}
            <section className="saas-card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Items & Reviews</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.order_item_id} className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-slate-900">{item.product_name}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.sku}</span>
                        </div>
                        {item.size && (
                          <p className="text-xs font-medium text-slate-500 mb-1">
                            Size: <span className="text-slate-900">{item.size}</span>
                          </p>
                        )}
                        <p className="text-sm text-slate-500">
                          Qty: <span className="font-bold text-slate-700">{item.quantity}</span> · 
                          Price: <span className="font-bold text-slate-700">${item.price_at_purchase}</span>
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-lg font-black text-slate-900">${(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                        
                        {order.status === 'delivered' && !item.rating && reviewingItemId !== item.order_item_id && (
                          <button 
                            onClick={() => setReviewingItemId(item.order_item_id)}
                            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-500 uppercase tracking-widest"
                          >
                            Write a Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Existing Review Display */}
                    {item.rating && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex text-amber-400 text-sm">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>{i < (item.rating || 0) ? "★" : "☆"}</span>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Rating</span>
                        </div>
                        <p className="text-sm text-slate-600 italic">"{item.comments || "No comment left."}"</p>
                      </div>
                    )}

                    {/* Review Form */}
                    {reviewingItemId === item.order_item_id && (
                      <div className="mt-4 bg-indigo-50/50 rounded-xl p-6 border border-indigo-100 animate-in fade-in zoom-in-95 duration-200">
                        <h5 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Leave a Review</h5>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          submitReview(
                            item.product_id, 
                            Number(formData.get("rating")), 
                            String(formData.get("comments"))
                          );
                        }} className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Star Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <label key={star} className="cursor-pointer">
                                  <input type="radio" name="rating" value={star} required className="sr-only peer" />
                                  <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500 transition-all hover:border-amber-400">
                                    {star}★
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Comments (Optional)</label>
                            <textarea 
                              name="comments" 
                              rows={3} 
                              className="saas-input py-3" 
                              placeholder="Tell us what you think about this product..."
                            />
                          </div>
                          <div className="flex gap-3">
                            <button 
                              type="submit" 
                              disabled={submittingReview}
                              className="saas-button-primary py-2 px-6"
                            >
                              {submittingReview ? "Submitting..." : "Post Review"}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setReviewingItemId(null)}
                              className="saas-button-secondary py-2 px-6"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="bg-slate-50/50 px-6 py-6 border-t border-slate-100">
                <div className="flex justify-end gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
                    <p className="text-sm font-bold text-slate-900">${order.total_amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-indigo-600">Total Charged</p>
                    <p className="text-lg font-black text-indigo-600">${order.total_amount}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="saas-card p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billing & Payment</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                    <p className="text-sm font-bold text-slate-900">{order.full_name}</p>
                    <p className="text-sm text-slate-600">{order.email}</p>
                  </div>
                  {order.payment_method && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {order.payment_method === 'cod' ? '💵' : 
                           ['gcash', 'paypal', 'maya', 'gotyme'].includes(order.payment_method) ? '📱' : '💳'}
                        </span>
                        <p className="text-sm font-bold text-slate-900 capitalize">
                          {order.payment_method.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <section className="saas-card p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Order Status</h3>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-lg ${
                    order.status === 'delivered' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}>
                    {order.status === 'delivered' ? '📦' : '🕒'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 capitalize">{order.status}</p>
                    <p className="text-xs text-slate-500">
                      {order.status === 'delivered' ? 'Your order has been received.' : 'Your order is being processed.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
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
        {error && order && (
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
