import api from "../api/api";
import { request } from "../api/request";

export async function createOrder(payload) {
  // payload: { consigned_id, quantity_ordered, payment_term }
  // rate_per_unit and total_amount are computed server-side — never send them
  return request(api.post("/api/orders/", payload));
}

export async function listMyOrders() {
  // buyer: BuyerOrders.jsx
  return request(api.get("/api/orders/me"));
}

export async function listOrdersAgainstMyConsignments() {
  // agent: AgentOrders.jsx
  return request(api.get("/api/orders/agent/me"));
}

export async function listAllOrders({ skip = 0, limit = 100 } = {}) {
  // admin: AdminOrdersOverview.jsx
  return request(api.get("/api/orders/", { params: { skip, limit } }));
}

export async function getOrder(orderId) {
  // the only endpoint that also returns computed payment_status/amount_paid
  return request(api.get(`/api/orders/${orderId}`));
}

export async function updateOrderStatus(orderId, status) {
  // status: "pending" | "confirmed" | "completed" | "cancelled"
  // only the owning agent or an admin can call this — buyers are rejected
  // server-side even if they somehow reach this call
  return request(api.patch(`/api/orders/${orderId}/status`, { status }));
}
