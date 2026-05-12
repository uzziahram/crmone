"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";
import { getActiveCustomerId } from "@/lib/active-customer";

type Order = {
  order_id: number;
  order_date: string;
  total_amount: number;
  status: string;
};

type CustomerProfile = {
  customer_id: number;
  full_name: string;
  orders: Order[];
};

export default function MyOrdersPage() {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = getActiveCustomerId();
    setCustomerId(id);
    if (id) {
      loadOrders(id);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadOrders(id: number) {
    setLoading(true);
    try {
      const data = await apiRequest<CustomerProfile>(`/api/customer/${id}`);
      // Sort orders by date descending
      const sortedOrders = (data.orders || []).sort(
        (a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      );
      setOrders(sortedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  if (!customerId && !loading) {
    return (
      <AppShell title="Access Denied">
        <div className="saas-card p-8 text-center max-w-md mx-auto">
          <p className="text-slate-600 mb-6">Please log in to view your orders.</p>
          <Link href="/loginpage" className="saas-button-primary w-full">
            Go to Login
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Order History">
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="saas-card p-6 animate-pulse h-24" />
            ))}
          </div>
        ) : error ? (
          <div className="saas-card p-6 bg-rose-50 border-rose-100 text-rose-600">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="saas-card p-12 text-center">
            <div className="mb-4 flex justify-center text-slate-200">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <Link href="/customer" className="saas-button-primary inline-flex items-center gap-2">
              Start Shopping
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.order_id} className="saas-card overflow-hidden hover:border-indigo-200 transition-all group">
                <Link href={`/customer/orders/${order.order_id}`} className="block p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">Order #{order.order_id}</span>
                          <span className={`saas-badge ${
                            order.status === "completed" || order.status === "delivered" 
                              ? "saas-badge-success" 
                              : order.status === "cancelled" 
                                ? "saas-badge-error" 
                                : "saas-badge-info"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Placed on {new Date(order.order_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Total Amount</p>
                        <p className="text-lg font-black text-slate-900">${Number(order.total_amount).toFixed(2)}</p>
                      </div>
                      <div className="text-indigo-600">
                        <svg className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
