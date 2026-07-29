import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, CreditCard, MapPin, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, localizeTrader, formatCurrency } from "../i18n/dataLocale";

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

export default function BuyerCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const cartItems = location.state?.cartItems || [];
  const currency = t("buyer.common.currency");
  const product = (name) => localizeProduct(name, language);
  const trader = (name) => localizeTrader(name, language);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [address, setAddress] = useState(t("buyer.checkout.defaultAddress"));
  const [notes, setNotes] = useState("");
  const [placed, setPlaced] = useState(false);

  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  const serviceFee = Math.round(subtotal * 0.01);
  const total = subtotal + serviceFee;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    console.log("Order placed:", { cartItems, paymentMethod, address, notes, total });
    setPlaced(true);
  };

  const fontImport = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
    .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
    .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
  `;

  // nothing to check out — send the buyer back to the marketplace
  if (cartItems.length === 0 && !placed) {
    return (
      <div className="font-body flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
        <style>{fontImport}</style>
        <h1 className="font-display text-2xl mb-2" style={{ color: COLORS.ink }}>
          {t("buyer.checkout.emptyCartTitle")}
        </h1>
        <p className="text-sm mb-6" style={{ color: COLORS.sub }}>
          {t("buyer.checkout.emptyCartSubtitle")}
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

  // order confirmed screen
  if (placed) {
    return (
      <div className="font-body flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
        <style>{fontImport}</style>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: "#eaf1e4" }}
        >
          <CheckCircle2 size={30} color={COLORS.leaf} />
        </div>
        <h1 className="font-display text-2xl mb-2" style={{ color: COLORS.ink }}>
          {t("buyer.checkout.orderPlacedTitle")}
        </h1>
        <p className="text-sm mb-6 max-w-sm" style={{ color: COLORS.sub }}>
          {t("buyer.checkout.orderPlacedSubtitle", { total: formatCurrency(total, t) })}
        </p>
        <button
          onClick={() => navigate("/buyer/orders")}
          className="px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
        >
          {t("buyer.checkout.viewMyOrders")}
        </button>
      </div>
    );
  }

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{fontImport}</style>

      {/* header */}
      <button
        onClick={() => navigate("/buyer/marketplace")}
        className="flex items-center gap-1.5 text-sm font-medium mb-4"
        style={{ color: COLORS.sub }}
      >
        <ArrowLeft size={15} style={isUr ? { transform: "scaleX(-1)" } : undefined} />
        {t("buyer.common.backToMarketplace")}
      </button>

      <h1 className="font-display text-2xl sm:text-3xl mb-1" style={{ color: COLORS.ink }}>
        {t("buyer.checkout.title")}
      </h1>
      <p className="text-sm mb-8" style={{ color: COLORS.sub }}>
        {t("buyer.checkout.subtitle")}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left column — delivery + payment */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-2 flex flex-col gap-6">
          {/* delivery details */}
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={16} color={COLORS.forest} />
              <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
                {t("buyer.checkout.deliveryDetails")}
              </h2>
            </div>

            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
              {t("buyer.checkout.deliveryAddressLabel")}
            </label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none mb-4"
              style={{ borderColor: COLORS.border }}
            />

            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
              {t("buyer.checkout.notesLabel")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("buyer.checkout.notesPlaceholder")}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
              style={{ borderColor: COLORS.border }}
            />
          </div>

          {/* payment method */}
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Wallet size={16} color={COLORS.forest} />
              <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
                {t("buyer.checkout.paymentMethod")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className="flex items-center gap-3 p-4 rounded-lg border text-left"
                style={
                  paymentMethod === "cash"
                    ? { borderColor: COLORS.leaf, backgroundColor: "#eaf1e4" }
                    : { borderColor: COLORS.border }
                }
              >
                <Wallet size={18} color={paymentMethod === "cash" ? COLORS.leaf : COLORS.sub} />
                <div>
                  <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{t("buyer.common.cash")}</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>{t("buyer.checkout.cashSubtitle")}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("credit")}
                className="flex items-center gap-3 p-4 rounded-lg border text-left"
                style={
                  paymentMethod === "credit"
                    ? { borderColor: COLORS.leaf, backgroundColor: "#eaf1e4" }
                    : { borderColor: COLORS.border }
                }
              >
                <CreditCard size={18} color={paymentMethod === "credit" ? COLORS.leaf : COLORS.sub} />
                <div>
                  <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{t("buyer.common.credit")}</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>{t("buyer.checkout.creditSubtitle")}</p>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
          >
            {t("buyer.checkout.placeOrder")} &middot; {formatCurrency(total, t)}
          </button>
        </form>

        {/* right column — order summary */}
        <div
          className="rounded-xl border p-6 h-fit"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <h2 className="font-display text-lg mb-4" style={{ color: COLORS.ink }}>
            {t("buyer.checkout.orderSummary")}
          </h2>

          <div className="flex flex-col gap-3 mb-5">
            {cartItems.map((item) => (
              <div key={item.consignId} className="flex items-center justify-between text-sm">
                <div>
                  <p style={{ color: COLORS.ink }}>{product(item.product)}</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>
                    {item.qty} &times; {currency} {item.price} &middot; {t("buyer.common.via", { agent: trader(item.agent) })}
                  </p>
                </div>
                <p className="font-medium" style={{ color: COLORS.ink }}>
                  {currency} {(item.qty * item.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2" style={{ borderColor: COLORS.greige }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.sub }}>{t("buyer.common.subtotal")}</span>
              <span style={{ color: COLORS.ink }}>{currency} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.sub }}>{t("buyer.checkout.serviceFee")}</span>
              <span style={{ color: COLORS.ink }}>{currency} {serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: COLORS.greige }}>
              <span className="font-medium" style={{ color: COLORS.ink }}>{t("buyer.common.total")}</span>
              <span className="font-display text-xl" style={{ color: COLORS.ink }}>
                {currency} {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
