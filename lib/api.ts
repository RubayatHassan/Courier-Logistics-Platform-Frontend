const DEFAULT_API_BASE = process.env.NODE_ENV === "production"
  ? "https://courier-logistics-platform-api.vercel.app/api/v1"
  : "http://localhost:4000/api/v1";
const CONFIGURED_API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");
export const API_BASE = process.env.NODE_ENV === "development" ? "/api/proxy" : CONFIGURED_API_BASE;
const TOKEN_KEY = "pace_access_token";
const PUBLIC_AUTH_PATHS = new Set([
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/login",
  "/auth/google",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
  "/auth/logout",
]);

export type Role = "CUSTOMER" | "MERCHANT" | "ADMIN" | "SUPER_ADMIN" | "HUB_MANAGER" | "RIDER";
export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  merchantId: string | null;
  phone?: string | null;
  emailVerifiedAt?: string | null;
};
export type Event = { status: string; note?: string | null; location?: string | null; createdAt: string };
export type Parcel = {
  id: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string | null;
  deliveryAddress?: string;
  pickupAddress?: string;
  codAmount?: string | number;
  deliveryCharge?: string | number;
  customer?: { name: string; phone?: string; email?: string };
  trackingEvents?: Event[];
  payments?: { method: string; amount: string | number; status: string; createdAt: string }[];
  currentHubId?: string | null;
};
export type Hub = { id: string; name: string; code: string; city?: string };
export type Rider = { id: string; hubId: string | null; vehicleType?: string | null; user: { name: string } };
export type Customer = { id: string; name: string; phone: string; email?: string | null };
export type Page<T> = { items: T[]; meta: { page: number; limit: number; total: number; pages: number } };
type Envelope<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: { message?: string; path?: (string | number)[] }[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
function accessToken() {
  return typeof window === "undefined" ? null : sessionStorage.getItem(TOKEN_KEY);
}
export function saveAccessToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearAccessToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, canRefresh = true): Promise<T> {
  const token = accessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include", cache: "no-store" });
  } catch {
    throw new ApiError("API-তে সংযোগ হচ্ছে না। Backend চালু আছে কি না দেখুন।", 0);
  }

  const endpoint = path.split("?")[0];
  if (response.status === 401 && token && canRefresh && !PUBLIC_AUTH_PATHS.has(endpoint)) {
    try {
      const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const result = (await refreshed.json()) as Envelope<{ accessToken: string }>;
      if (refreshed.ok && result.data?.accessToken) {
        saveAccessToken(result.data.accessToken);
        return request<T>(path, init, false);
      }
    } catch {
      /* show the original request error and send the customer to login */
    }
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !body?.success)
    throw new ApiError(
      body?.errors?.[0]?.message ?? body?.message ?? "Request সফল হয়নি। আবার চেষ্টা করুন।",
      response.status,
    );
  return body.data as T;
}

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, headers?: HeadersInit) => request<T>(path, { ...json(body), headers }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { ...json(body), method: "PATCH" }),
  async login(email: string, password: string) {
    clearAccessToken();
    const result = await request<{ accessToken: string; user: User }>("/auth/login", json({ email, password }), false);
    saveAccessToken(result.accessToken);
    return result.user;
  },
  async logout() {
    try {
      await request<{ loggedOut: boolean }>("/auth/logout", json({}), false);
    } finally {
      clearAccessToken();
    }
  },
  async me() {
    return request<User>("/auth/me");
  },
  async googleLogin(credential: string) {
    clearAccessToken();
    const result = await request<{ accessToken: string; user: User }>(
      "/auth/google",
      json({ credential }),
      false,
    );
    saveAccessToken(result.accessToken);
    return result.user;
  },
};
