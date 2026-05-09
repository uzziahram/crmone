"use client";

export async function apiRequest<TResponse>(
  path: string,
  options?: RequestInit
): Promise<TResponse> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.message === "string"
        ? payload.message
        : "Request failed";
    throw new Error(message);
  }

  return payload as TResponse;
}
