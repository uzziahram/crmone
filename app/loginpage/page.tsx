"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/client-api";
import { setActiveCustomerId, getActiveCustomerId } from "@/lib/active-customer";
import { setRole, UserRole } from "@/lib/session";

type CustomerMember = {
  customer_id: number;
  email: string;
  full_name: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UserRole>("customer");
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function syncActiveCustomerByEmail(email: string) {
    const members = await apiRequest<CustomerMember[]>(
      "/api/customer/getAllMembers"
    );
    const match = members.find(
      (member) => member.email.toLowerCase() === email.toLowerCase()
    );
    if (match) {
      setActiveCustomerId(match.customer_id);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const full_name = String(formData.get("full_name") ?? "");
      const email = String(formData.get("email") ?? "");
      const username = String(formData.get("username") ?? "");
      const password = String(formData.get("password") ?? "");
      const contact_number = String(formData.get("contact_number") ?? "");
      const address = String(formData.get("address") ?? "");

      if (mode === "customer" && isRegistering) {
        await apiRequest<{ message: string }>("/api/register", {
          method: "POST",
          body: JSON.stringify({
            full_name,
            email,
            password,
            contact_number,
            address,
          }),
        });
        await syncActiveCustomerByEmail(email);
        setRole("customer");
        setMessage("Registration successful. Redirecting...");
        router.push("/customer");
      } else {
        const endpoint = mode === "admin" ? "/api/admin/login" : "/api/userLogin";
        await apiRequest<{ message: string }>(endpoint, {
          method: "POST",
          body: JSON.stringify(
            mode === "admin"
              ? { username, password }
              : { email, password }
          ),
        });
        if (mode === "customer") {
          await syncActiveCustomerByEmail(email);
          const customerId = getActiveCustomerId();
          if (!customerId) {
            throw new Error("Could not load customer profile. Please try again.");
          }
          setRole("customer");
          setMessage("Customer login successful. Redirecting...");
          router.push("/customer");
        } else {
          setRole("admin");
          setMessage("Admin login successful. Redirecting...");
          router.push("/admin/dashboard");
        }
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Action failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-indigo-200 shadow-lg">
          C
        </div>
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          CRM<span className="text-indigo-600">ONE</span>
        </span>
      </div>

      <section className="w-full max-w-md saas-card p-8 shadow-2xl! ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "customer" 
              ? (isRegistering ? "Create your account" : "Customer Login") 
              : "Admin Portal"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "customer"
              ? "Access your dashboard, orders, and cart."
              : "Management tools for administrators."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "customer" && isRegistering && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <input
                required
                name="full_name"
                placeholder="John Doe"
                className="saas-input"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {mode === "customer" ? "Email Address" : "Admin Username"}
            </label>
            <input
              required
              type={mode === "customer" ? "email" : "text"}
              name={mode === "customer" ? "email" : "username"}
              placeholder={mode === "customer" ? "you@example.com" : "admin_user"}
              className="saas-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <input
              required
              type="password"
              name="password"
              placeholder="••••••••"
              className="saas-input"
            />
          </div>

          {mode === "customer" && isRegistering && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone
                </label>
                <input
                  name="contact_number"
                  placeholder="+1 (555) 000-0000"
                  className="saas-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Address
                </label>
                <input
                  name="address"
                  placeholder="123 Street, City"
                  className="saas-input"
                />
              </div>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="saas-button-primary w-full py-2.5 text-base"
          >
            {loading
              ? "Please wait..."
              : mode === "customer" && isRegistering
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4">
          {mode === "customer" && (
            <button
              type="button"
              onClick={() => {
                setIsRegistering((prev) => !prev);
                setError("");
                setMessage("");
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 text-center"
            >
              {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Register now"}
            </button>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or switch role</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === "customer" ? "admin" : "customer"));
              setIsRegistering(false);
              setError("");
              setMessage("");
            }}
            className="saas-button-secondary w-full"
          >
            Switch to {mode === "customer" ? "Admin" : "Customer"} Login
          </button>
        </div>

        {(message || error) && (
          <div className={`mt-6 rounded-lg p-3 text-sm font-medium ${
            message ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
          }`}>
            {message || error}
          </div>
        )}
      </section>

      <footer className="mt-12 text-sm text-slate-400">
        &copy; {new Date().getFullYear()} CRMONE Systems. All rights reserved.
      </footer>
    </div>
  );
}
