"use client";

export type UserRole = "customer" | "admin";

const ROLE_KEY = "role";

export function setRole(role: UserRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
}

export function getRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(ROLE_KEY);
  return value === "customer" || value === "admin" ? value : null;
}

export function clearRole() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROLE_KEY);
}
