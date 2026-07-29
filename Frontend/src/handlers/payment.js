import api from "../api/api";
import { request } from "../api/request";

export async function createPayment(payload) {
  // payload: { payee_id, payee_type, payment_method, order_id, amount_paid, transaction_reference, payment_date }
  // payee_type: "S" | "B" | "CA"   payment_method: "cash" | "card" | "other"
  // payer is always whoever is logged in — never send payer_id/payer_type
  // order_id, transaction_reference, payment_date are optional
  return request(api.post("/api/payments/", payload));
}

export async function listMyPayments() {
  // either side of a payment — powers SupplierPayments.jsx,
  // AgentSettlements.jsx, and BuyerPayments.jsx
  return request(api.get("/api/payments/me"));
}

export async function listPaymentsForOrder(orderId) {
  // only the buyer who placed the order, the agent who owns its
  // consignment, or an admin can call this
  return request(api.get(`/api/payments/order/${orderId}`));
}
