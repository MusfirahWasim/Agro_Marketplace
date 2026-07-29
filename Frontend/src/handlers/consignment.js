import api from "../api/api";
import { request } from "../api/request";

export async function createConsignment(payload) {
  // payload: { supply_id, quantity_consigned, selling_price_per_unit, commission_rate, payment_term }
  // commission_rate is optional — omit to fall back to the platform default rate
  return request(api.post("/api/consignments/", payload));
}

export async function listMyConsignments() {
  // agent: AgentInventory.jsx — everything this agent currently manages
  return request(api.get("/api/consignments/me"));
}

export async function listMyConsignmentHistory() {
  // supplier: SupplierConsignments.jsx — history of handovers to agents
  return request(api.get("/api/consignments/supplier/me"));
}

export async function browseMarketplace() {
  // buyer: BuyerMarketplace.jsx — only confirmed consignments with stock left
  return request(api.get("/api/consignments/marketplace"));
}

export async function getConsignment(consignedId) {
  return request(api.get(`/api/consignments/${consignedId}`));
}

export async function updateConsignmentStatus(consignedId, status) {
  // status: "pending" | "confirmed" | "completed" | "cancelled"
  // (only pending->confirmed/cancelled and confirmed->completed/cancelled
  // are actually valid — see VALID_CONSIGNMENT_TRANSITIONS on the backend)
  return request(
    api.patch(`/api/consignments/${consignedId}/status`, { status })
  );
}
