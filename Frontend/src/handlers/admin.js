import api from "../api/api";
import { request } from "../api/request";

export async function getDashboardStats() {
  // AdminDashboard.jsx — system-wide totals across all four roles.
  // Response shape isn't backed by a formal schema yet (no
  // schemas/admin.py on the backend) — currently returns:
  // { parties_by_type, total_orders, total_order_value,
  //   active_consignments, total_ledger_credit_volume }
  return request(api.get("/api/admin/dashboard"));
}
