// Thin fetch wrapper around the LAUNCH TIME backend API.
//
// - Sends the in-memory access token as a Bearer header.
// - Always sends credentials so the httpOnly refresh cookie travels with
//   every request (needed for /auth/refresh).
// - On a 401 from any endpoint other than /auth/*, tries exactly one
//   silent refresh, then retries the original request once.
// - Every request has a timeout and every failure is logged, so a broken
//   or unreachable backend fails loudly instead of hanging silently.

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const REQUEST_TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) sessionStorage.setItem("lt:access", token);
    else sessionStorage.removeItem("lt:access");
  }
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = sessionStorage.getItem("lt:access");
  }
  return accessToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          setAccessToken(null);
          return false;
        }
        const body = await res.json();
        setAccessToken(body.data.accessToken);
        return true;
      })
      .catch((err) => {
        console.error(`Token refresh against ${API_URL}/auth/refresh failed:`, err);
        setAccessToken(null);
        return false;
      })
      .finally(() => {
        clearTimeout(timeout);
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, opts = {}) {
  const { method = "GET", body, formData, skipAuthRetry, query } = opts;
  const isAuthRoute = path.startsWith("/auth/");

  let url = `${API_URL}${path}`;
  if (query && Object.keys(query).length) {
    const usp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
    });
    const qs = usp.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !formData) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  // Uploads (image/video → Cloudinary) legitimately take longer than a
  // plain JSON request, especially on a slower connection — give them more
  // room before treating it as a hang.
  const timeoutMs = formData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = err.name === "AbortError";
    const message = timedOut
      ? `Request to ${url} timed out — is the backend running and is VITE_API_URL set correctly?`
      : `Request to ${url} failed — is the backend reachable and CORS-configured for this origin?`;
    console.error(message, err);
    throw new ApiError(0, message);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 && !isAuthRoute && !skipAuthRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, { ...opts, skipAuthRetry: true });
    }
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    // no body (e.g. some 204s)
  }

  if (!res.ok) {
    const message = payload?.message || `Request failed (${res.status})`;
    if (!(res.status === 401 && isAuthRoute)) {
      // Expected 401s on /auth/refresh and /auth/me (logged-out visitor)
      // aren't worth alarming console noise over.
      console.error(`API error on ${method} ${path}:`, message, payload?.errors || "");
    }
    throw new ApiError(res.status, message, payload?.errors);
  }

  return payload?.data;
}

export const api = {
  get: (path, query) => request(path, { method: "GET", query }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData, method = "POST") => request(path, { method, formData }),
};
