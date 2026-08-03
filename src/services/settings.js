import { api } from "./api";

// GET /api/settings — public, whitelisted key/value map (e.g. offpay_registration_url)
export function getPublicSettings() {
  return api.get("/settings");
}
