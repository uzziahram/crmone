"use client";

export async function apiRequest<TResponse>(
  path: string,
  options?: RequestInit
): Promise<TResponse> {
  const isFormData = options?.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> ?? {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    ...options,
    headers,
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
