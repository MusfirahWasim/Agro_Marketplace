import api from "../api/api";
import { request } from "../api/request";

export async function createSupply(payload) {
  // payload: { item_name, category, unit, current_stock, cost_per_unit, description }
  return request(api.post("/api/supplies/", payload));
}

export async function listMySupplies() {
  return request(api.get("/api/supplies/me"));
}

export async function listCategories() {
  return request(api.get("/api/supplies/categories"));
}

export async function listAvailableSupplies(supplierId) {
  // used by AgentConsignmentIntake.jsx's supply picker
  return request(api.get(`/api/supplies/available/${supplierId}`));
}

export async function getSupply(supplyId) {
  return request(api.get(`/api/supplies/${supplyId}`));
}

export async function updateSupply(supplyId, payload) {
  // payload: { item_name, category, unit, current_stock, cost_per_unit, description } — all optional
  return request(api.put(`/api/supplies/${supplyId}`, payload));
}

export async function deleteSupply(supplyId) {
  return request(api.delete(`/api/supplies/${supplyId}`));
}
