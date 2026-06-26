const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const API_BASE = `${BASE}/api`;

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || "Request failed"), { status: res.status, data: err });
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || "Upload failed"), { status: res.status, data: err });
  }

  return res.json();
}

/**
 * Convert a stored file path like /uploads/cover.jpg → /api/uploads/cover.jpg
 * so that the Replit proxy correctly routes the request to the API server.
 */
export function getImageUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  if (filePath.startsWith("/uploads/")) {
    return `${BASE}/api/uploads/${filePath.slice("/uploads/".length)}`;
  }
  if (filePath.startsWith("/api/uploads/")) {
    return `${BASE}${filePath}`;
  }
  return filePath;
}
