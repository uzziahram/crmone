"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { apiRequest } from "@/lib/client-api";
import {
  getActiveCustomerId,
  setActiveCustomerId,
} from "@/lib/active-customer";

type CustomerSummary = {
  customer_id: number;
  full_name: string;
  email: string;
  contact_number?: string;
  address?: string;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [activeCustomerId, setActiveCustomerState] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCustomers() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<CustomerSummary[]>("/api/customer/getAllMembers");
      setCustomers(data);
      setActiveCustomerState(getActiveCustomerId());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const activeCustomer = useMemo(
    () => customers.find((customer) => customer.customer_id === activeCustomerId),
    [customers, activeCustomerId]
  );

  return (
    <AppShell title="Customer Management">
      <div className="space-y-6">
        {/* Active Customer Notice */}
        {activeCustomer && (
          <div className="saas-card bg-indigo-50 border-indigo-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {activeCustomer.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Active Context</p>
                <p className="text-sm font-bold text-indigo-900">{activeCustomer.full_name} (#{activeCustomer.customer_id})</p>
              </div>
            </div>
            <Link href="/customer" className="saas-button-primary py-1.5 px-3 text-xs">
              Go to Storefront
            </Link>
          </div>
        )}

        <div className="saas-card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Registered Members</h2>
            <button
              onClick={() => void loadCustomers()}
              className="saas-button-secondary py-1.5 px-3 text-xs"
            >
              Refresh List
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 italic">
              Loading member directory...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 bg-rose-50 font-medium">
              {error}
            </div>
          ) : (
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-3">Member</th>
                    <th className="px-6 py-3">Contact Info</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr key={customer.customer_id} className={`hover:bg-slate-50 transition-colors ${activeCustomerId === customer.customer_id ? "bg-indigo-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {customer.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{customer.full_name}</p>
                            <p className="text-xs text-slate-500">ID: #{customer.customer_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900">{customer.email}</p>
                        <p className="text-xs text-slate-500">{customer.contact_number || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 max-w-[200px] truncate">{customer.address || "No address provided"}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveCustomerId(customer.customer_id);
                              setActiveCustomerState(customer.customer_id);
                            }}
                            className={`saas-button-secondary py-1 px-2 text-[10px] uppercase tracking-wider ${activeCustomerId === customer.customer_id ? "bg-indigo-600 text-white ring-0 hover:bg-indigo-700" : ""}`}
                          >
                            {activeCustomerId === customer.customer_id ? "Active" : "Set Active"}
                          </button>
                          <Link
                            href={`/customers/${customer.customer_id}`}
                            className="saas-button-secondary py-1 px-2 text-[10px] uppercase tracking-wider"
                          >
                            Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
