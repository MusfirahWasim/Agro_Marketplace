import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sprout, Plus, Minus, ShoppingCart, MapPin, Building2, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, localizeCategory, localizeTrader } from "../i18n/dataLocale";
import { getConsignment } from "../handlers/consignment";

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
  // Route param is still named consignId (App.jsx wasn't touched here) —
  // its value is the real integer consigned_id, just an older param name.
  const { consignId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const currency = t("buyer.common.currency");
  const productName = (name) => localizeProduct(name, language);
  const category = (name) => localizeCategory(name, language);
  const trader = (name) => localizeTrader(name, language);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await getConsignment(consignId);
      if (cancelled) return;

      if (error) {
        // For a bad/missing ID this is literally "Consignment not found"
        // straight from the backend — same message the old mock-based
        // not-found screen used to show, just sourced from the API now.
        setLoadError(error);
      } else {
        setProduct(data);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [consignId]);

  const fontImport = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
    .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
    .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
  `;

  if (loading) {
    return (
      <div className="font-body flex items-center justify-center py-24" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
        <style>{fontImport}</style>
        <Loader2 size={22} className="animate-spin" color={COLORS.forest} />
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="font-body flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
        <style>{fontImport}</style>
        <h1 className="font-display text-2xl mb-2" style={{ color: COLORS.ink }}>
          {t("buyer.productDetail.notFoundTitle")}
        </h1>
        <p className="text-sm mb-6" style={{ color: COLORS.sub }}>
          {loadError || t("buyer.productDetail.notFoundSubtitle")}
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

  const lineTotal = qty * product.selling_price_per_unit;

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
            {productName(product.item_name)}
          </h1>
          <p className="text-sm mb-5" style={{ color: COLORS.sub }}>
            {t("buyer.productDetail.consignmentLabel", { id: product.consigned_id })}
          </p>

          <div className="flex items-center gap-6 mb-6">
            <div>
              <p className="font-display text-2xl" style={{ color: COLORS.ink }}>
                {currency} {product.selling_price_per_unit}
                <span className="text-sm font-normal" style={{ color: COLORS.sub }}>
                  {" "}/ {product.unit}
                </span>
              </p>
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: COLORS.greige }} />
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.leaf }}>
                {t("buyer.common.availableUnit", { count: product.quantity_remaining, unit: product.unit })}
              </p>
            </div>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#4a5240" }}>
              {product.description}
            </p>
          )}

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
                <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{trader(product.supplier_name)}</p>
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
                <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{trader(product.agent_name)}</p>
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
              <button onClick={() => setQty((q) => Math.min(product.quantity_remaining, q + 1))}>
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
            {/* Inert — there's no shared cart state between this page and
                BuyerMarketplace.jsx (cart lives in BuyerMarketplace's own
                local useState, not a Context/global store), so clicking
                this can't actually add anywhere. "Buy now" above works
                because it doesn't depend on shared state — it just
                navigates straight to checkout with this one item. Making
                this button real means introducing shared cart state,
                which wasn't asked for here — flagging rather than faking
                it or silently making it behave identically to Buy Now. */}
            <button
              disabled
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border opacity-60 cursor-not-allowed"
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