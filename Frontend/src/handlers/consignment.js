import api from "../api/api";
import { request } from "../api/request";

/**
 * FastAPI/pydantic validation errors (422s) come back as either:
 *   { detail: "some string" }
 * or:
 *   { detail: [{ type, loc, msg, input }, ...] }
 * `request()` currently hands that shape straight through as `error`,
 * which crashes any component that renders `{error}` directly (React
 * can't render a raw object/array as a child). Every export below
 * routes through this so callers only ever see a string.
 */
function normalizeError(error) {
  if (!error) return error;
  if (typeof error === "string") return error;

  // Some request() implementations may already unwrap to `detail`,
  // others may pass the whole response body — handle both.
  const detail = error.detail ?? error;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc.at(-1) : d?.loc;
        return d?.msg ? (field ? `${field}: ${d.msg}` : d.msg) : null;
      })
      .filter(Boolean)
      .join("; ") || "Request failed validation.";
  }

  if (typeof detail === "object" && typeof detail.msg === "string") {
    return detail.msg;
  }

  return "Something went wrong. Please try again.";
}

async function requestSafe(promise) {
  const { data, error } = await request(promise);
  return { data, error: normalizeError(error) };
}

export async function createConsignment(payload) {
  // payload: { supply_id, quantity_consigned, selling_price_per_unit, commission_rate, payment_term }
  // commission_rate is optional — omit to fall back to the platform default rate
  return requestSafe(api.post("/api/consignments/", payload));
}

export async function listMyConsignments() {
  // agent: AgentInventory.jsx — everything this agent currently manages
  return requestSafe(api.get("/api/consignments/me"));
}

export async function listMyConsignmentHistory() {
  // supplier: SupplierConsignments.jsx — history of handovers to agents
  return requestSafe(api.get("/api/consignments/supplier/me"));
}

export async function browseMarketplace() {
  // buyer: BuyerMarketplace.jsx — only confirmed consignments with stock left
  return requestSafe(api.get("/api/consignments/marketplace"));
}

export async function getConsignment(consignedId) {
  return requestSafe(api.get(`/api/consignments/${consignedId}`));
}

export async function updateConsignmentStatus(consignedId, status) {
  // status: "pending" | "confirmed" | "completed" | "cancelled"
  // (only pending->confirmed/cancelled and confirmed->completed/cancelled
  // are actually valid — see VALID_CONSIGNMENT_TRANSITIONS on the backend)
  return requestSafe(
    api.patch(`/api/consignments/${consignedId}/status`, { status })
  );
}