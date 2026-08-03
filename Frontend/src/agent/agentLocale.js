import { translations } from "../i18n/translations";

// Looks up a raw English data string (product name, trader/supplier/buyer
// name, or AI reason string) in the Urdu data dictionaries and returns the
// Urdu version when language is "ur". Falls back to the original English
// string if no translation exists yet, so nothing ever renders blank.
//
// IMPORTANT: these dictionaries only cover the fixed mock strings the app
// shipped with. Real supply item_name / party name / AI-generated reason
// text from the live API are arbitrary user-entered or generated strings —
// they will not match any dictionary key, so this silently no-ops (returns
// the original string) for real data. That's safe, not broken, but it
// means real data won't actually get translated to Urdu this way. A real
// translation strategy (server-side localization, or a proper MT service)
// will eventually be needed for anything that isn't one of these fixed
// mock values. Several screens (AgentConsignmentIntake, AgentInventory,
// AgentOrders) have already stopped calling localizeProduct for this
// reason once their product names became real data.
export function localizeProduct(name, language) {
  if (language !== "ur") return name;
  return translations.ur.agent.data.products[name] || name;
}

export function localizeTrader(name, language) {
  if (language !== "ur") return name;
  return translations.ur.agent.data.traders[name] || name;
}

export function localizeReason(text, language) {
  if (language !== "ur") return text;
  return translations.ur.agent.data.reasons[text] || text;
}

// Formats a date string using the Urdu or English locale so dates display
// with localized month names when in Urdu. Accepts either a bare
// YYYY-MM-DD string OR a full ISO datetime (e.g. "2026-07-14T10:23:00",
// what the real API's created_at fields actually return) — previously this
// always appended "T00:00:00", which corrupted real datetime strings into
// invalid dates (e.g. "...T10:23:00T00:00:00") and silently fell back to
// showing the raw unformatted string. Fixed to detect which shape it got.
export function formatAgentDate(dateStr, language) {
  if (!dateStr) return dateStr;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const d = new Date(isDateOnly ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  try {
    return d.toLocaleDateString(language === "ur" ? "ur-PK" : "en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Formats a currency amount with the localized "Rs" / "روپے" label.
export function formatAgentCurrency(amount, t) {
  return `${t("buyer.common.currency")} ${Number(amount).toLocaleString()}`;
}