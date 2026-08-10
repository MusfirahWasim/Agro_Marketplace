import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  Wallet,
  Receipt,
  TrendingUp,
  Inbox,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { listMyPayments } from "../handlers/payment";
import { getMyLedger } from "../handlers/account";
import { getMyProfile } from "../handlers/party";

/**
 * SupplierPayments
 * Settlements this supplier has received from agents, plus any refunds
 * sent back out, and the supplier's current account balance.
 *
 * Real data sources:
 * - GET /api/payments/me  (listMyPayments) — every payment where this
 *   supplier is either side. Confirmed fields per handlers/payment.js:
 *   id, payer_id, payer_type, payee_id, payee_type, payment_method
 *   ("cash" | "card" | "other"), order_id, amount_paid,
 *   transaction_reference, payment_date.
 * - GET /api/accounts/me  (getMyLedger) — this party's account row.
 *   Assumed to expose a `balance` field (same field family as
 *   `credit_limit` used in adminUpdateParty) — NOT CONFIRMED, see note
 *   at bottom of file.
 * - GET /api/parties/me   (getMyProfile) — used only to know this
 *   party's own id/party_type, so we can tell "received" apart from
 *   "sent" on a payments-for-either-side list.
 *
 * Deliberately REMOVED vs. the old mock, because nothing in the handler
 * files backs them (see note at bottom for what's needed to restore
 * any of these properly instead of guessing):
 * - per-payment "type" (settlement / partial_settlement / refund)
 * - per-payment "status" (completed / pending / failed)
 * - per-payment "running balance" snapshot
 * - "consignment" reference on a payment — payments reference
 *   order_id, not a consignment id, so the column is now "Order"
 * - agent/counterparty display name — shown as "Type #id" until the
 *   backend confirms it returns a joined party name
 *
 * NOTE ON TRANSLATIONS: per the existing convention in LoginPage.jsx
 * ("translations.js changes are off-limits right now"), the couple of
 * labels below that didn't already exist as translation keys
 * (Counterparty, Order, Received/Sent, Other) are hardcoded in English
 * rather than routed through t(), same as LoginPage's validation
 * message. Everything that already had a key keeps using t().
 */

const METHOD_LABEL = {
  cash: "supplier.payments.methods.cash",
  card: null, // no existing key — hardcoded below
  other: null, // no existing key — hardcoded below
};

export default function SupplierPayments() {
  const { t, formatDate, language } = useLanguage();
  const isUr = language === "ur";
  const currency = t("supplier.common.currency");

  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all"); // all | received | sent

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      const [paymentsRes, ledgerRes, profileRes] = await Promise.all([
        listMyPayments(),
        getMyLedger(),
        getMyProfile(),
      ]);
      if (!mounted) return;
      const firstError = paymentsRes.error || ledgerRes.error || profileRes.error;
      if (firstError) {
        setError(firstError);
        setLoading(false);
        return;
      }
      setPayments(paymentsRes.data ?? []);
      setBalance(ledgerRes.data?.balance ?? null);
      setMe(profileRes.data ?? null);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Tag each payment with which side of it we're on, since /payments/me
  // returns both directions with no direction flag of its own.
  const withDirection = useMemo(() => {
    return payments.map((p) => {
      const isReceived = !!me && p.payee_id === me.id && p.payee_type === me.party_type;
      return {
        ...p,
        direction: isReceived ? "received" : "sent",
        counterpartyId: isReceived ? p.payer_id : p.payee_id,
        counterpartyType: isReceived ? p.payer_type : p.payee_type,
      };
    });
  }, [payments, me]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withDirection.filter((p) => {
      const matchesDirection = directionFilter === "all" || p.direction === directionFilter;
      const matchesQuery =
        q === "" ||
        String(p.id).toLowerCase().includes(q) ||
        String(p.order_id ?? "").toLowerCase().includes(q) ||
        String(p.counterpartyId ?? "").toLowerCase().includes(q);
      return matchesDirection && matchesQuery;
    });
  }, [withDirection, query, directionFilter]);

  const stats = useMemo(() => {
    const totalReceived = withDirection
      .filter((p) => p.direction === "received")
      .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const now = new Date();
    const thisMonth = withDirection
      .filter(
        (p) =>
          p.direction === "received" &&
          p.payment_date &&
          new Date(p.payment_date).getMonth() === now.getMonth() &&
          new Date(p.payment_date).getFullYear() === now.getFullYear()
      )
      .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    return { totalReceived, thisMonth };
  }, [withDirection]);

  return (
    <div
      className="min-h-full bg-[#faf9f5] px-6 py-8 sm:px-8"
      dir={isUr ? "rtl" : "ltr"}
      style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : undefined }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');`}</style>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#1e4620] mb-1.5">{t("supplier.payments.title")}</h1>
          <p className="text-gray-500">{t("supplier.payments.subtitle")}</p>
        </div>
        {/* Not wired — no export endpoint exists in any handler file yet.
            Left in place (same "intentionally inert" pattern as the
            forgot-password link in LoginPage.jsx) rather than silently
            deleted, since export wasn't in scope for this pass. */}
        <button
          type="button"
          disabled
          title="Not available yet — no export endpoint"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed self-start"
        >
          <Download className="h-4 w-4" />
          {t("supplier.payments.exportLedger")}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 mb-6 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label={t("supplier.payments.stats.currentBalance")}
          value={balance == null ? "—" : `${currency} ${Number(balance).toLocaleString()}`}
          accent
        />
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label={t("supplier.payments.stats.totalReceived")}
          value={`${currency} ${stats.totalReceived.toLocaleString()}`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={t("supplier.payments.stats.receivedThisMonth")}
          value={`${currency} ${stats.thisMonth.toLocaleString()}`}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus-within:border-[#1e4620] focus-within:ring-2 focus-within:ring-[#1e4620]/10 transition-shadow">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("supplier.payments.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="outline-none text-sm text-gray-800 bg-transparent appearance-none cursor-pointer pr-5"
          >
            <option value="all">{t("supplier.payments.filters.all")}</option>
            {/* No existing translation keys for these two — hardcoded, see file header note */}
            <option value="received">Received</option>
            <option value="sent">Sent</option>
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 -ml-6 pointer-events-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">{t("supplier.payments.loading")}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">{t("supplier.payments.noResults")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e4620]/5 text-left text-gray-600">
                  <Th>{t("supplier.payments.table.payment")}</Th>
                  <Th>{t("supplier.payments.table.date")}</Th>
                  <Th>Counterparty</Th>
                  <Th>Order</Th>
                  <Th>{t("supplier.payments.table.method")}</Th>
                  <Th className="text-right">{t("supplier.payments.table.amount")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#faf9f5] transition-colors">
                    <Td className="font-medium text-[#1e4620]">#{p.id}</Td>
                    <Td className="text-gray-500">{p.payment_date ? formatDate(p.payment_date) : "—"}</Td>
                    <Td>
                      {/* TODO: swap for a joined party name once the payments
                          endpoint confirms it returns one */}
                      {p.counterpartyType} #{p.counterpartyId}
                    </Td>
                    <Td className="text-gray-500">{p.order_id ? `#${p.order_id}` : "—"}</Td>
                    <Td className="text-gray-500">
                      {METHOD_LABEL[p.payment_method] ? t(METHOD_LABEL[p.payment_method]) : p.payment_method === "card" ? "Card" : "Other"}
                    </Td>
                    <Td className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          p.direction === "sent" ? "text-red-600" : "text-[#2f7d32]"
                        }`}
                      >
                        {p.direction === "sent" ? (
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                        )}
                        {p.direction === "sent" ? "-" : "+"}
                        {currency} {Number(p.amount_paid || 0).toLocaleString()}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-start gap-4">
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-[#f0b84c]/20 text-[#8a5a12]" : "bg-[#1e4620]/10 text-[#1e4620]"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-semibold text-[#1e4620]">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-3.5 font-medium whitespace-nowrap ${className}`}>{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`px-5 py-4 whitespace-nowrap text-gray-700 ${className}`}>{children}</td>;
}

/**
 * OPEN ITEMS — need the actual model/schema to close these out instead of
 * guessing further:
 * 1. Account/ledger schema (models/schemas for `accounts`, + the
 *    accounts router) — to confirm the `balance` field name on
 *    GET /api/accounts/me, and whether per-transaction running-balance
 *    snapshots exist anywhere (if so, they'd live on the account/ledger
 *    entry, not the payment, and I'd wire them in properly).
 * 2. Payment schema/model + payments router response serializer — to
 *    confirm: (a) whether payments carry any status/lifecycle field at
 *    all, (b) whether the list endpoint joins payer/payee party name,
 *    (c) exact field name for the created timestamp if different from
 *    payment_date.
 * 3. Party schema — to confirm the exact id/party_type field names
 *    returned by GET /api/parties/me (I assumed `id` and `party_type`,
 *    matching the S/CA/B/A convention already used in LoginPage.jsx).
 */
