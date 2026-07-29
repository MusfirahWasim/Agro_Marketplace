import { translations } from "./translations";

// Looks up a raw English data string in the Urdu data dictionaries and
// returns the Urdu version when language is "ur". Falls back to the
// original English string if no translation exists yet, so nothing ever
// renders blank — including for marketplace data (data/consignments.js)
// whose exact product/category strings we may not have full visibility into.
export function localizeProduct(name, language) {
  if (language !== "ur" || !name) return name;
  return translations.ur.agent.data.products[name] || name;
}

export function localizeCategory(name, language) {
  if (language !== "ur" || !name) return name;
  return translations.ur.agent.data.categories[name] || name;
}

export function localizeTrader(name, language) {
  if (language !== "ur" || !name) return name;
  return translations.ur.agent.data.traders[name] || name;
}

export function localizeReason(text, language) {
  if (language !== "ur" || !text) return text;
  return translations.ur.agent.data.reasons[text] || text;
}

// Formats an ISO date string (YYYY-MM-DD) using the Urdu or English locale
// so dates display with localized month names when in Urdu.
export function formatLocaleDate(dateStr, language) {
  if (!dateStr) return dateStr;
  const d = new Date(`${dateStr}T00:00:00`);
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
export function formatCurrency(amount, t) {
  return `${t("buyer.common.currency")} ${Number(amount).toLocaleString()}`;
}

// Formats a "<number> kg" style quantity string with the localized unit.
export function localizeUnit(unit, language) {
  if (language !== "ur" || !unit) return unit;
  const UNIT_UR = { kg: "کلوگرام", g: "گرام", l: "لیٹر", pcs: "عدد", dozen: "درجن" };
  return UNIT_UR[unit.toLowerCase()] || unit;
}
