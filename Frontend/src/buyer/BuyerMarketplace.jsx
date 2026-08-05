import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sprout, Plus, Minus, ShoppingCart, X, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, localizeCategory, localizeTrader } from "../i18n/dataLocale";
import { browseMarketplace } from "../handlers/consignment";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  goldDark: "#d99e2f",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
  border: "#d9ddce",
};

export default function BuyerMarketplace() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const product = (name) => localizeProduct(name, language);
  const category = (name) => localizeCategory(name, language);
  const trader = (name) => localizeTrader(name, language);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState({}); // consigned_id -> qty
  const [showCart, setShowCart] = useState(false);

  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await browseMarketplace();
      if (cancelled) return;

      if (error) {
        setLoadError(error);
      } else {
        setConsignments(data);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived from the actual fetched consignments, not a separate
  // /api/supplies/categories call — that endpoint returns every
  // category across ALL supplies, including ones with nothing
  // currently for sale. Scoping to what's really on the marketplace
  // right now is more correct for a filter list.
  const categories = ["All", ...new Set(consignments.map((c) => c.category).filter(Boolean))];

  const filtered = consignments.filter((c) => {
    const matchesSearch =
      (c.item_name || "").toLowerCase().includes(search.toLowerCase()) ||
      product(c.item_name).toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (consignedId) => {
    setCart((prev) => ({ ...prev, [consignedId]: (prev[consignedId] || 0) + 1 }));
  };

  const decrement = (consignedId) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[consignedId] <= 1) {
        delete next[consignedId];
      } else {
        next[consignedId] -= 1;
      }
      return next;
    });
  };

  const cartItems = Object.entries(cart).map(([consignedId, qty]) => {
    // consigned_id from the backend is a number; object keys are always
    // strings, so compare loosely rather than requiring exact type match
    const item = consignments.find((c) => String(c.consigned_id) === consignedId);
    return { ...item, qty };
  });

  const cartTotal = cartItems.reduce((sum, i) => sum + i.qty * i.selling_price_per_unit, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const currency = t("buyer.common.currency");

  return (
    <div className="font-body relative" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
        .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
      `}</style>

      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
            {t("buyer.marketplace.title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            {t("buyer.marketplace.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: COLORS.forest, color: "white" }}
        >
          <ShoppingCart size={16} />
          {t("buyer.marketplace.cart")}
          {cartCount > 0 && (
            <span
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-medium"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* search + category filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#909685" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("buyer.marketplace.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: COLORS.border, backgroundColor: "white" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className="text-xs font-medium px-3 py-2 rounded-lg border"
              style={
                activeCategory === c
                  ? { backgroundColor: COLORS.leaf, color: "white", borderColor: COLORS.leaf }
                  : { color: COLORS.sub, borderColor: COLORS.border }
              }
            >
              {c === "All" ? c : category(c)}
            </button>
          ))}
        </div>
      </div>

      {/* loading / error states */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin" color={COLORS.forest} />
        </div>
      )}

      {!loading && loadError && (
        <div
          className="text-sm rounded-lg px-4 py-3 mb-6"
          style={{ backgroundColor: "#faeaea", color: "#b5544a" }}
        >
          {loadError}
        </div>
      )}

      {/* product grid */}
      {!loading && !loadError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div
              key={c.consigned_id}
              onClick={() => navigate(`/buyer/product/${c.consigned_id}`)}
              className="rounded-xl border p-4 flex flex-col cursor-pointer transition-shadow hover:shadow-md"
              style={{ backgroundColor: "white", borderColor: COLORS.greige }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: "#eaf1e4" }}
              >
                <Sprout size={20} color={COLORS.leaf} />
              </div>
              <h3 className="font-display text-base mb-0.5" style={{ color: COLORS.ink }}>
                {product(c.item_name)}
              </h3>
              <p className="text-xs mb-3" style={{ color: COLORS.sub }}>
                {t("buyer.common.via", { agent: trader(c.agent_name) })}
              </p>

              <div className="flex items-center justify-between text-xs mb-4" style={{ color: COLORS.sub }}>
                <span>
                  {t("buyer.common.availableUnit", { count: c.quantity_remaining, unit: c.unit })}
                </span>
                <span className="font-medium" style={{ color: COLORS.ink }}>
                  {currency} {c.selling_price_per_unit}/{c.unit}
                </span>
              </div>

              {cart[c.consigned_id] ? (
                <div className="flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => decrement(c.consigned_id)}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center"
                    style={{ borderColor: COLORS.border }}
                  >
                    <Minus size={14} color={COLORS.ink} />
                  </button>
                  <span className="font-medium text-sm" style={{ color: COLORS.ink }}>
                    {cart[c.consigned_id]}
                  </span>
                  <button
                    onClick={() => addToCart(c.consigned_id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: COLORS.gold }}
                  >
                    <Plus size={14} color={COLORS.forestDark} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(c.consigned_id);
                  }}
                  className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                >
                  <Plus size={14} />
                  {t("buyer.marketplace.add")}
                </button>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div
              className="col-span-full text-center py-12 rounded-xl border"
              style={{ borderColor: COLORS.greige, color: COLORS.sub }}
            >
              {t("buyer.marketplace.noResults")}
            </div>
          )}
        </div>
      )}

      {/* cart drawer */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: "rgba(23,35,26,0.45)" }}
          onClick={() => setShowCart(false)}
        >
          <div
            className="w-full max-w-sm h-full flex flex-col p-5"
            style={{ backgroundColor: COLORS.cream }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl" style={{ color: COLORS.ink }}>
                {t("buyer.marketplace.cartDrawerTitle")}
              </h2>
              <button onClick={() => setShowCart(false)}>
                <X size={20} color={COLORS.sub} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {cartItems.length === 0 && (
                <p className="text-sm" style={{ color: COLORS.sub }}>
                  {t("buyer.marketplace.cartEmpty")}
                </p>
              )}

              {cartItems.map((item) => (
                <div
                  key={item.consigned_id}
                  className="rounded-lg border p-3 flex items-center justify-between"
                  style={{ backgroundColor: "white", borderColor: COLORS.greige }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: COLORS.ink }}>
                      {product(item.item_name)}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.sub }}>
                      {item.qty} &times; {currency} {item.selling_price_per_unit}
                    </p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: COLORS.leaf }}>
                    {currency} {(item.qty * item.selling_price_per_unit).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t pt-4 mt-4" style={{ borderColor: COLORS.greige }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm" style={{ color: COLORS.sub }}>
                    {t("buyer.common.total")}
                  </span>
                  <span className="font-display text-xl" style={{ color: COLORS.ink }}>
                    {currency} {cartTotal.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => navigate("/buyer/checkout", { state: { cartItems, cartTotal } })}
                  className="w-full py-3 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: COLORS.forest, color: "white" }}
                >
                  {t("buyer.marketplace.proceedToCheckout")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}