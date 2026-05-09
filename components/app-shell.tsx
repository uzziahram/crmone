"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearRole, getRole } from "@/lib/session";
import { clearActiveCustomerId } from "@/lib/active-customer";
import { apiRequest } from "@/lib/client-api";

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

  useEffect(() => {
    setMounted(true);
    setRole(getRole());
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
            {mounted && (
              <button
                onClick={handleLogout}
                className="saas-button-secondary py-1.5 px-3"
              >
                Log out
              </button>
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
