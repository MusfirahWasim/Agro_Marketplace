import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sprout, Plus, Minus, ShoppingCart, MapPin, Building2 } from "lucide-react";
import { CONSIGNMENTS } from "../data/consignments";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, localizeCategory, localizeTrader } from "../i18n/dataLocale";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
  border: "#d9ddce",
};

export default function BuyerProductDetail() {
  const { consignId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const product = CONSIGNMENTS.find((c) => c.consignId === consignId);
  const [qty, setQty] = useState(1);
  const currency = t("buyer.common.currency");
  const productName = (name) => localizeProduct(name, language);
  const category = (name) => localizeCategory(name, language);
  const trader = (name) => localizeTrader(name, language);

  const fontImport = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
    .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
    .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
  `;

  if (!product) {
    return (
      <div className="font-body flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
        <style>{fontImport}</style>
        <h1 className="font-display text-2xl mb-2" style={{ color: COLORS.ink }}>
          {t("buyer.productDetail.notFoundTitle")}
        </h1>
        <p className="text-sm mb-6" style={{ color: COLORS.sub }}>
          {t("buyer.productDetail.notFoundSubtitle")}
        </p>
        <button
          onClick={() => navigate("/buyer/marketplace")}
          className="px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: COLORS.forest, color: "white" }}
        >
          {t("buyer.common.backToMarketplace")}
        </button>
      </div>
    );
  }

  const lineTotal = qty * product.price;

  const handleBuyNow = () => {
    navigate("/buyer/checkout", {
      state: {
        cartItems: [{ ...product, qty }],
        cartTotal: lineTotal,
      },
    });
  };

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{fontImport}</style>

      <button
        onClick={() => navigate("/buyer/marketplace")}
        className="flex items-center gap-1.5 text-sm font-medium mb-6"
        style={{ color: COLORS.sub }}
      >
        <ArrowLeft size={15} style={isUr ? { transform: "scaleX(-1)" } : undefined} />
        {t("buyer.common.backToMarketplace")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* image / icon panel */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl border aspect-square flex items-center justify-center"
            style={{ backgroundColor: "#eaf1e4", borderColor: COLORS.greige }}
          >
            <Sprout size={72} color={COLORS.leaf} />
          </div>
        </div>

        {/* details */}
        <div className="lg:col-span-3">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: COLORS.greige, color: COLORS.forest }}
          >
            {category(product.category)}
          </span>

          <h1 className="font-display text-3xl mt-3 mb-1" style={{ color: COLORS.ink }}>
            {productName(product.product)}
          </h1>
          <p className="text-sm mb-5" style={{ color: COLORS.sub }}>
            {t("buyer.productDetail.consignmentLabel", { id: product.consignId })}
          </p>

          <div className="flex items-center gap-6 mb-6">
            <div>
              <p className="font-display text-2xl" style={{ color: COLORS.ink }}>
                {currency} {product.price}
                <span className="text-sm font-normal" style={{ color: COLORS.sub }}>
                  {" "}/ {product.unit}
                </span>
              </p>
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: COLORS.greige }} />
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.leaf }}>
                {t("buyer.common.availableUnit", { count: product.available, unit: product.unit })}
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-6" style={{ color: "#4a5240" }}>
            {product.description}
          </p>

          {/* supplier / agent info */}
          <div
            className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#eaf1e4" }}
              >
                <Building2 size={16} color={COLORS.leaf} />
              </div>
              <div>
                <p className="text-xs" style={{ color: COLORS.sub }}>{t("buyer.productDetail.suppliedBy")}</p>
                <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{trader(product.supplier)}</p>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px" style={{ backgroundColor: COLORS.greige }} />
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#eaf1e4" }}
              >
                <MapPin size={16} color={COLORS.leaf} />
              </div>
              <div>
                <p className="text-xs" style={{ color: COLORS.sub }}>{t("buyer.productDetail.consignedVia")}</p>
                <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{trader(product.agent)}</p>
              </div>
            </div>
          </div>

          {/* quantity + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 border rounded-lg px-3 py-2 w-fit" style={{ borderColor: COLORS.border }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={15} color={COLORS.ink} />
              </button>
              <span className="text-sm font-medium w-8 text-center" style={{ color: COLORS.ink }}>
                {qty}
              </span>
              <button onClick={() => setQty((q) => Math.min(product.available, q + 1))}>
                <Plus size={15} color={COLORS.ink} />
              </button>
              <span className="text-xs" style={{ color: COLORS.sub }}>{product.unit}</span>
            </div>

            <p className="text-sm" style={{ color: COLORS.sub }}>
              {t("buyer.productDetail.subtotalPrefix")}{" "}
              <span className="font-medium" style={{ color: COLORS.ink }}>
                {currency} {lineTotal.toLocaleString()}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleBuyNow}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              {t("buyer.productDetail.buyNow")}
            </button>
            <button
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border"
              style={{ borderColor: COLORS.forest, color: COLORS.forest }}
            >
              <ShoppingCart size={16} />
              {t("buyer.productDetail.addToCart")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
