"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearRole, getRole } from "@/lib/session";
import { clearActiveCustomerId, getActiveCustomerId } from "@/lib/active-customer";
import { apiRequest } from "@/lib/client-api";

type CustomerProfile = {
  full_name: string;
  email: string;
  customer_id: number;
  contact_number?: string;
  address?: string;
  orders?: Array<{
    order_id: number;
    order_date: string;
    total_amount: number;
    status: string;
  }>;
};

export default function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const userRole = getRole();
    setRole(userRole);

    if (userRole === "customer") {
      const customerId = getActiveCustomerId();
      if (customerId) {
        apiRequest<CustomerProfile>(`/api/customer/${customerId}`)
          .then(setProfile)
          .catch(console.error);
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await apiRequest("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      clearRole();
      clearActiveCustomerId();
      router.push("/loginpage");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                CRM<span className="text-indigo-600">ONE</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {!mounted ? (
                <div className="h-4 w-24 animate-pulse bg-slate-100 rounded" />
              ) : role === "admin" ? (
                <>
                  <Link href="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/customer" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    Store
                  </Link>
                  <Link href="/customer/cart" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    My Cart
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {!mounted ? "---" : role === "admin" ? "Administrator" : "Customer"}
              </span>
            </div>
            
            {mounted && role && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                    {role === "customer" && profile ? (
                      <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-900">{profile.full_name}</p>
                        <p className="text-xs text-slate-500 truncate mb-2">{profile.email}</p>
                        {profile.contact_number && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                             <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                             </svg>
                             {profile.contact_number}
                          </p>
                        )}
                      </div>
                    ) : role === "admin" ? (
                      <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-900">Administrator</p>
                        <p className="text-xs text-slate-500">System Admin</p>
                      </div>
                    ) : null}

                    <div className="py-1">
                      {role === "customer" && (
                        <>
                          <div className="px-4 py-2">
                             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Navigation</p>
                             <div className="space-y-1">
                                <Link
                                  href="/customer"
                                  className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                  Product Store
                                </Link>
                                <Link
                                  href="/customer/cart"
                                  className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  My Shopping Cart
                                </Link>
                             </div>
                          </div>

                          <div className="px-4 py-2 border-t border-slate-50">
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Orders</p>
                                <Link href="/customer/orders" className="text-[10px] font-bold text-indigo-600 hover:underline" onClick={() => setIsDropdownOpen(false)}>
                                   View All
                                </Link>
                             </div>
                             <div className="space-y-1">
                                {!profile?.orders?.length ? (
                                  <p className="text-[10px] text-slate-400 italic px-2">No recent orders</p>
                                ) : (
                                  profile.orders.slice(0, 3).map(order => (
                                    <Link
                                      key={order.order_id}
                                      href={`/customer/orders/${order.order_id}`}
                                      className="flex items-center justify-between px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 group transition-colors"
                                      onClick={() => setIsDropdownOpen(false)}
                                    >
                                       <span className="font-medium text-slate-700">Order #{order.order_id}</span>
                                       <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                         order.status === 'completed' || order.status === 'delivered' 
                                           ? 'bg-emerald-50 text-emerald-600' 
                                           : 'bg-amber-50 text-amber-600'
                                       }`}>
                                          {order.status}
                                       </span>
                                    </Link>
                                  ))
                                )}
                             </div>
                          </div>
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors mt-1 pt-2 border-t border-slate-100"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          {title && (
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
