import api from "../api/api";
import { request } from "../api/request";

export async function getMyLedger() {
  // powers SupplierPayments.jsx, AgentSettlements.jsx, BuyerPayments.jsx —
  // each just reads their own party's ledger
  return request(api.get("/api/accounts/me"));
}

export async function getAllLedgerEntries({ skip = 0, limit = 100 } = {}) {
  // admin: AdminAccountsLedger.jsx — the full, unfiltered ledger
  return request(api.get("/api/accounts/", { params: { skip, limit } }));
}
