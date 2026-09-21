import { api, setAccessToken } from "./api";
import { errorMessage } from "../lib/errors";

export async function login(email, password) {
  const data = await api.post("/auth/login", { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function register(payload) {
  const data = await api.post("/auth/register", payload);
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export function me() {
  return api.get("/auth/me");
}

export function forgotPassword(email) {
  return api.post("/auth/forgot-password", { email });
}

export function resetPassword(token, password) {
  return api.post("/auth/reset-password", { token, password });
}

export function authErrorMessage(err) {
  return errorMessage(err);
}
