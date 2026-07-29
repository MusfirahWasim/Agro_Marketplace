import { translations } from "../i18n/translations";

// Looks up a raw English data string (product name, trader/supplier/buyer
// name, or AI reason string) in the Urdu data dictionaries and returns the
// Urdu version when language is "ur". Falls back to the original English
// string if no translation exists yet, so nothing ever renders blank.
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

// Formats an ISO date string (YYYY-MM-DD) using the Urdu or English locale
// so dates display with localized month names when in Urdu.
export function formatAgentDate(dateStr, language) {
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
export function formatAgentCurrency(amount, t) {
  return `${t("buyer.common.currency")} ${Number(amount).toLocaleString()}`;
}
