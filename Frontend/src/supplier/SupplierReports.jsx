import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  Package,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * SupplierReports
 * AI-powered insights for the supplier: demand forecasting, inventory
 * prediction, and price recommendations, scoped to this supplier's products.
 *
 * Matches the Modern Organic & Eco-Friendly theme:
 * - Off-white background, forest-green + gold accents
 * - "AI generated" badges on insight cards to distinguish model output from raw data
 * Fully localized (English / Urdu) via LanguageContext — chart week labels,
 * product filter, and all AI insight text come from translation keys.
 */

const PRODUCTS = ["all", "basmatiRice", "redOnion", "wheat", "tomato"];

// TODO: replace with real output from the AI forecasting service
// (week is a number here; the display label is localized at render time)
const DEMAND_FORECAST = [
  { week: 1, actual: 420, forecast: 400 },
  { week: 2, actual: 460, forecast: 445 },
  { week: 3, actual: 510, forecast: 500 },
  { week: 4, actual: null, forecast: 560 },
  { week: 5, actual: null, forecast: 605 },
  { week: 6, actual: null, forecast: 640 },
];

const PRICE_TREND = [
  { week: 1, market: 285, yours: 280 },
  { week: 2, market: 292, yours: 280 },
  { week: 3, market: 305, yours: 290 },
  { week: 4, market: 310, yours: 290 },
];

const INSIGHTS = [
  { id: 1, type: "opportunity" },
  { id: 2, type: "price" },
  { id: 3, type: "warning" },
  { id: 4, type: "opportunity" },
];

const INSIGHT_STYLES = {
  opportunity: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-[#2f7d32] bg-[#3f8f43]/10 border-[#3f8f43]/25",
  },
  price: {
    icon: <Lightbulb className="h-4 w-4" />,
    color: "text-[#8a5a12] bg-[#f0b84c]/20 border-[#f0b84c]/40",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-red-600 bg-red-50 border-red-200",
  },
};

export default function SupplierReports() {
  const { t, language } = useLanguage();
  const isUr = language === "ur";
  const [product, setProduct] = useState(PRODUCTS[0]);

  const weekLabel = (n) => (isUr ? `ہفتہ ${n}` : `Wk ${n}`);
  const demandData = useMemo(
    () => DEMAND_FORECAST.map((d) => ({ ...d, weekLabel: weekLabel(d.week) })),
    [isUr]
  );
  const priceData = useMemo(
    () => PRICE_TREND.map((d) => ({ ...d, weekLabel: weekLabel(d.week) })),
    [isUr]
  );

  const forecastNote = useMemo(() => {
    const last = DEMAND_FORECAST[DEMAND_FORECAST.length - 1].forecast;
    const first = DEMAND_FORECAST[0].forecast;
    const pctChange = Math.round(((last - first) / first) * 100);
    return pctChange;
  }, []);

  return (
    <div className="min-h-full bg-[#faf9f5] px-6 py-8 sm:px-8" dir={isUr ? "rtl" : "ltr"} style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : undefined }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');`}</style>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a5a12] bg-[#f0b84c]/20 border border-[#f0b84c]/40 rounded-full px-2.5 py-1 mb-2.5">
            <Sparkles className="h-3 w-3" />
            {t("supplier.reports.aiPowered")}
          </div>
          <h1 className="font-serif text-3xl text-[#1e4620] mb-1.5">
            {t("supplier.reports.title")}
          </h1>
          <p className="text-gray-500">
            {t("supplier.reports.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 self-start">
          <Package className="h-4 w-4 text-gray-400" />
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="outline-none text-sm text-gray-800 bg-transparent appearance-none cursor-pointer pr-5"
          >
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {t(`supplier.reports.products.${p}`)}
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 -ml-6 pointer-events-none" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Demand forecast */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-serif text-lg text-[#1e4620]">
                {t("supplier.reports.demandForecast")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("supplier.reports.actualVsForecast")}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                forecastNote >= 0
                  ? "text-[#2f7d32] bg-[#3f8f43]/10"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {forecastNote >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {forecastNote >= 0 ? "+" : ""}
              {forecastNote}%
            </span>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name={t("supplier.reports.actualSalesKg")}
                  stroke="#1e4620"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name={t("supplier.reports.forecastKg")}
                  stroke="#f0b84c"
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price trend */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-serif text-lg text-[#1e4620]">
            {t("supplier.reports.priceBenchmarking")}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {t("supplier.reports.priceSubtitle")}
          </p>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="yours" name={t("supplier.reports.yourPrice")} fill="#1e4620" radius={[6, 6, 0, 0]} />
                <Bar dataKey="market" name={t("supplier.reports.marketAverage")} fill="#f0b84c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#8a5a12]" />
        <h2 className="font-serif text-lg text-[#1e4620]">
          {t("supplier.reports.insightsForYou")}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INSIGHTS.map((insight) => {
          const style = INSIGHT_STYLES[insight.type];
          return (
            <div
              key={insight.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${style.color}`}
                >
                  {style.icon}
                  {t(`supplier.reports.insights.${insight.id}.tag`)}
                </span>
              </div>
              <h3 className="font-medium text-[#1e4620] leading-snug">
                {t(`supplier.reports.insights.${insight.id}.title`)}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t(`supplier.reports.insights.${insight.id}.body`)}
              </p>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#1e4620] hover:gap-2.5 transition-all self-start"
              >
                {t("common.viewDetails")}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
