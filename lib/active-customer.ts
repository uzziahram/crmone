"use client";

const ACTIVE_CUSTOMER_KEY = "active_customer_id";

export function getActiveCustomerId(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(ACTIVE_CUSTOMER_KEY);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setActiveCustomerId(customerId: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_CUSTOMER_KEY, String(customerId));
}

export function clearActiveCustomerId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_CUSTOMER_KEY);
}
