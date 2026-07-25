import {
  Sprout,
  PackageCheck,
  Wallet,
  Clock,
  Plus,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader } from "../i18n/dataLocale";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
};

const STATS = [
  { labelKey: "stockAvailable", value: "3,240", unit: "kg", icon: Sprout, tint: COLORS.leaf },
  { labelKey: "activeConsignments", value: "12", unit: "", icon: PackageCheck, tint: COLORS.forest },
  { labelKey: "pendingSettlements", value: "84,500", unit: "currency", icon: Wallet, tint: COLORS.gold },
  { labelKey: "awaitingPickup", value: "3", unit: "lots", icon: Clock, tint: "#a35c2b" },
];

const CONSIGNMENTS = [
  { id: "CN-1042", agent: "Rafiq Traders", productKey: "tomatoGradeA", qty: 600, status: "inMarket" },
  { id: "CN-1041", agent: "Bilal & Co.", productKey: "onion", qty: 1200, status: "sold" },
  { id: "CN-1039", agent: "Rafiq Traders", productKey: "potato", qty: 900, status: "inMarket" },
  { id: "CN-1036", agent: "Karachi Fresh Agents", productKey: "tomatoGradeB", qty: 450, status: "settled" },
];

const STATUS_STYLE = {
  inMarket: { bg: "#eaf1e4", text: COLORS.leaf },
  sold: { bg: "#fdf1dc", text: "#a3721b" },
  settled: { bg: "#e6ede6", text: COLORS.forest },
};

const LOW_STOCK = [
  { productKey: "tomatoGradeA", qty: "40" },
  { productKey: "greenChili", qty: "15" },
  { productKey: "spinach", qty: "22" },
];

export default function SupplierDashboard() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const unit = isUr ? "کلوگرام" : "kg";
  const trader = (name) => localizeTrader(name, language);

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
        .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
      `}</style>

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
            {t("supplier.dashboard.welcome", { name: trader("Ahmed") })}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            {t("supplier.dashboard.subtitle")}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium self-start"
          style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
        >
          <Plus size={16} />
          {t("supplier.dashboard.addNewSupply")}
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div
            key={s.labelKey}
            className="rounded-xl p-5 border"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${s.tint}1a` }}
            >
              <s.icon size={18} color={s.tint} />
            </div>
            <p className="font-display text-2xl" style={{ color: COLORS.ink }}>
              {s.unit === "currency"
                ? `${t("supplier.common.currency")} ${s.value}`
                : s.unit === "lots"
                ? `${s.value} ${t("supplier.dashboard.lotsUnit")}`
                : s.unit
                ? `${s.value} ${unit}`
                : s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.sub }}>
              {t(`supplier.dashboard.stats.${s.labelKey}`)}
            </p>
          </div>
        ))}
      </div>

      {/* main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* recent consignments */}
        <div
          className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: COLORS.greige }}
          >
            <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
              {t("supplier.dashboard.recentConsignments")}
            </h2>
            <button
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: COLORS.leaf }}
            >
              {t("supplier.dashboard.viewAll")} <ArrowUpRight size={14} />
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.sub }}>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.consignment")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.agent")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.product")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.qty")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {CONSIGNMENTS.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: COLORS.greige }}>
                  <td className="px-5 py-3 font-medium" style={{ color: COLORS.ink }}>
                    {c.id}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {trader(c.agent)}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {t(`common.produce.${c.productKey}`)}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {c.qty.toLocaleString()} {unit}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: STATUS_STYLE[c.status].bg,
                        color: STATUS_STYLE[c.status].text,
                      }}
                    >
                      {t(`supplier.dashboard.consignmentStatus.${c.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* alerts / side panel */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.gold} />
              <h3 className="font-display text-base text-white">{t("supplier.dashboard.lowStockAlerts")}</h3>
            </div>
            <ul className="space-y-2.5 text-sm">
              {LOW_STOCK.map((item) => (
                <li key={item.productKey} className="flex items-center justify-between">
                  <span style={{ color: "#c9d9c2" }}>{t(`common.produce.${item.productKey}`)}</span>
                  <span className="text-white font-medium">
                    {t("supplier.common.kgLeft", { qty: item.qty })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <h3 className="font-display text-base mb-4" style={{ color: COLORS.ink }}>
              {t("supplier.dashboard.thisMonth")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>{t("supplier.dashboard.totalConsigned")}</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>4,850 {unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>{t("supplier.dashboard.totalSold")}</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>3,920 {unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>{t("supplier.dashboard.settlementsReceived")}</span>
                <span className="font-medium" style={{ color: COLORS.leaf }}>
                  {t("supplier.common.currency")} 612,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
