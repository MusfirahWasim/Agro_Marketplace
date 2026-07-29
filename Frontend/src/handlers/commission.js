import api from "../api/api";
import { request } from "../api/request";

export async function listMyCommissions() {
  // agent: AgentCommissions.jsx — each row includes a derived
  // payout_status ("pending" | "paid" | "reversed"), computed
  // server-side from the ledger, not stored on the commission itself
  return request(api.get("/api/commissions/me"));
}

export async function markCommissionPaid(commissionId) {
  // only the owning agent or an admin can call this
  return request(api.post(`/api/commissions/${commissionId}/mark-paid`));
}
