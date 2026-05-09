"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";
import { setActiveCustomerId } from "@/lib/active-customer";

type CustomerProfile = {
  customer_id: number;
  full_name: string;
  email: string;
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
    product_id: number;
    quantity: number;
    product?: {
      product_name: string;
      sku: string;
      price: number;
    };
  }>;
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSuccess, setActiveSuccess] = useState(false);

  useEffect(() => {
    async function loadCustomer() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<CustomerProfile>(`/api/customer/${params.id}`);
        setProfile(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      void loadCustomer();
    }
  }, [params.id]);

  const handleSetActive = () => {
    if (profile) {
      setActiveCustomerId(profile.customer_id);
      setActiveSuccess(true);
      setTimeout(() => setActiveSuccess(false), 3000);
    }
  };

  return (
    <AppShell title={`Customer Profile`}>
      {loading ? (
        <div className="saas-card p-12 text-center animate-pulse">
          <div className="h-8 w-1/4 bg-slate-100 rounded mx-auto mb-4"></div>
          <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto"></div>
        </div>
      ) : error ? (
        <div className="saas-card bg-rose-50 border-rose-100 p-8 text-center">
          <p className="text-rose-600 font-bold mb-4">{error}</p>
        </div>
      ) : profile ? (
        <div className="space-y-8">
          {/* Header Card */}
          <section className="saas-card p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
                  {profile.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-1">{profile.full_name}</h2>
                  <p className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Customer ID: #{profile.customer_id}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSetActive}
                  className={`saas-button-primary py-3 px-6 shadow-lg transition-all ${activeSuccess ? "bg-emerald-600 hover:bg-emerald-600" : ""}`}
                >
                  {activeSuccess ? "✓ Context Updated" : "Set as Active Customer"}
                </button>
                <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-tighter">Use this to switch store view context</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-sm font-medium text-slate-900">{profile.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Number</p>
                <p className="text-sm font-medium text-slate-900">{profile.contact_number || "Not provided"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Physical Address</p>
                <p className="text-sm font-medium text-slate-900">{profile.address || "Not provided"}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Orders Section */}
            <section className="saas-card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Order History</h3>
              </div>
              <div className="p-0">
                {!profile.orders?.length ? (
                  <div className="p-12 text-center text-slate-400 italic">No orders recorded for this customer.</div>
                orders?: Array<{
                  order_id: number;
                  order_date: string;
                  total_amount: number;
                  status: string;
                  payment_method?: string;
                }>;
                ...
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                      <tr>
                                        <th className="px-6 py-3">Order ID</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Payment</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {profile.orders.map((order) => (
                                        <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-6 py-4 font-bold text-slate-900">#{order.order_id}</td>
                                          <td className="px-6 py-4">
                                            <span className={`saas-badge ${order.status === "delivered" ? "saas-badge-success" : "saas-badge-info"}`}>
                                              {order.status}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                              {order.payment_method || "N/A"}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 text-right font-black text-slate-900">${order.total_amount}</td>
                                        </tr>
                                      ))}
                                    </tbody>

            </section>

            {/* Cart Section */}
            <section className="saas-card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Current Cart Items</h3>
              </div>
              <div className="p-0">
                {!profile.cart_items?.length ? (
                  <div className="p-12 text-center text-slate-400 italic">Cart is currently empty.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                          <th className="px-6 py-3">Product</th>
                          <th className="px-6 py-3">Qty</th>
                          <th className="px-6 py-3 text-right">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.cart_items.map((item) => (
                          <tr key={item.cart_item_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{item.product?.product_name || `Product ${item.product_id}`}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{item.product?.sku}</p>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-600">x{item.quantity}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">${item.product?.price ?? "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
