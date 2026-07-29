import api from "../api/api";
import { request } from "../api/request";

export async function signup(payload) {
  // payload: { name, party_type, phone, cnic, email, password, billing_address, shipping_address }
  return request(api.post("/api/auth/signup", payload));
}

export async function login(payload) {
  // payload: { email, password }
  const result = await request(api.post("/api/auth/login", payload));
  if (result.data) {
    localStorage.setItem("access_token", result.data.access_token);
    localStorage.setItem("refresh_token", result.data.refresh_token);
  }
  return result;
}

export async function refreshToken() {
  // Manual refresh trigger if ever needed outside the automatic
  // interceptor flow in api.js — reads the stored refresh_token itself.
  const refresh_token = localStorage.getItem("refresh_token");
  const result = await request(api.post("/api/auth/refresh", { refresh_token }));
  if (result.data) {
    localStorage.setItem("access_token", result.data.access_token);
    localStorage.setItem("refresh_token", result.data.refresh_token);
  }
  return result;
}

export async function forgotPassword(email) {
  return request(api.post("/api/auth/forgot-password", { email }));
}

export async function verifyOtp(email, otp_code) {
  return request(api.post("/api/auth/verify-otp", { email, otp_code }));
}

export async function resetPassword(email, otp_code, new_password) {
  return request(
    api.post("/api/auth/reset-password", { email, otp_code, new_password })
  );
}

export function logout() {
  // No backend call — there's no token-revocation store yet (flagged
  // as a known gap earlier), so logout is just clearing local tokens.
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}