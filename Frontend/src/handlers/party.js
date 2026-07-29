import api from "../api/api";
import { request } from "../api/request";

export async function getMyProfile() {
  return request(api.get("/api/parties/me"));
}

export async function updateMyProfile(payload) {
  // payload: { name, phone, email, billing_address, shipping_address } — all optional
  return request(api.put("/api/parties/me", payload));
}

export async function changeMyPassword(payload) {
  // payload: { current_password, new_password }
  return request(api.put("/api/parties/me/password", payload));
}

export async function adminListParties({ partyType, skip = 0, limit = 100 } = {}) {
  return request(
    api.get("/api/parties/", {
      params: { party_type: partyType, skip, limit },
    })
  );
}

export async function adminGetParty(partyType, partyId) {
  return request(api.get(`/api/parties/${partyType}/${partyId}`));
}

export async function adminUpdateParty(partyType, partyId, payload) {
  // payload: { active_status, credit_limit } — both optional
  return request(api.patch(`/api/parties/${partyType}/${partyId}`, payload));
}
