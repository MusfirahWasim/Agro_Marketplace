import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, CreditCard, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, localizeTrader, formatCurrency } from "../i18n/dataLocale";
import { createOrder } from "../handlers/order";
import { getMyProfile, updateMyProfile } from "../handlers/party";

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
  const [placed, setPlaced] = useState(false);
  const [placedTotal, setPlacedTotal] = useState(0);

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState(null);

  // Editable profile info shown/edited right here at checkout — saves
  // back to the real party record via updateMyProfile, same as
  // ProfileSettings.jsx. Shown: name, email, phone, billing/shipping
  // address (everything from PartyRead that's both relevant to an
  // order and actually editable). NOT shown: credit_limit, account
  // status, member since, party_type — account-level info, not
  // editable via PartyUpdate anyway, and not relevant to placing an
  // order. password is never touched here at all.
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    billing_address: "",
    shipping_address: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoadingProfile(true);
      const { data } = await getMyProfile();
      if (!cancelled && data) {
        setProfileForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          billing_address: data.billing_address || "",
          shipping_address: data.shipping_address || "",
        });
      }
      setLoadingProfile(false);
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile() {
    setProfileSaveError(null);
    setProfileSaveSuccess(false);
    setSavingProfile(true);

    const { error } = await updateMyProfile(profileForm);
    setSavingProfile(false);

    if (error) {
      setProfileSaveError(error);
      return { success: false, error };
    }
    setProfileSaveSuccess(true);
    return { success: true };
  }

  async function handleSaveProfile() {
    await saveProfile();
  }

  // No service fee — dropped, matches the earlier decision. There is
  // no column anywhere (orders/payments/accounts) that this maps to.
  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.selling_price_per_unit, 0);
  const total = subtotal;

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setPlaceError(null);

    // Auto-save any pending profile edits first, so a forgotten "Save
    // changes" click doesn't silently lose the edit. If the save fails,
    // stop here rather than placing the order while an unsaved edit
    // sits in the form — surfacing the problem beats losing data quietly.
    const profileResult = await saveProfile();
    if (!profileResult.success) {
      setPlaceError(`Could not save your updated info before placing the order: ${profileResult.error}`);
      return;
    }

    setPlacing(true);

    // A cart can span multiple consignments, but the backend only
    // supports one order per consignment — so this fires N independent
    // creates, not one atomic multi-line order.
    const results = await Promise.all(
      cartItems.map((item) =>
        createOrder({
          consigned_id: item.consigned_id,
          quantity_ordered: item.qty,
          payment_term: paymentMethod,
        })
      )
    );

    setPlacing(false);

    const failed = results
      .map((r, i) => ({ ...r, item: cartItems[i] }))
      .filter((r) => r.error);

    if (failed.length > 0) {
      // NOTE: no rollback — any items that succeeded above are now real
      // orders and stay that way. Flagged as a known architecture gap,
      // not solved here (would need either a single atomic bulk-order
      // endpoint, or explicit cancellation of the succeeded orders).
      setPlaceError(
        `${failed.length} of ${cartItems.length} item(s) could not be ordered: ` +
          failed.map((f) => `${product(f.item.item_name)} — ${f.error}`).join("; ")
      );
      return;
    }

    // Sum the REAL total_amount from each created order's response,
    // not the client-computed subtotal — the two should match, but the
    // backend's number is the actual source of truth.
    const realTotal = results.reduce((sum, r) => sum + Number(r.data.total_amount), 0);
    setPlacedTotal(realTotal);
    setPlaced(true);
  }

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
          {t("buyer.checkout.orderPlacedSubtitle", { total: formatCurrency(placedTotal, t) })}
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
          {/* delivery details — editable, saves back to the real party
              record. There's no per-order address override in the
              schema, so "changing address for this order" really means
              updating the profile itself. */}
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

            {loadingProfile ? (
              <div className="flex items-center gap-2 text-sm py-4" style={{ color: COLORS.sub }}>
                <Loader2 size={14} className="animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                    Full name
                  </label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    maxLength={50}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    maxLength={50}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                    Phone
                  </label>
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    maxLength={13}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                    {t("buyer.checkout.deliveryAddressLabel")} (shipping)
                  </label>
                  <input
                    value={profileForm.shipping_address}
                    onChange={(e) => setProfileForm({ ...profileForm, shipping_address: e.target.value })}
                    maxLength={150}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                    Billing address
                  </label>
                  <input
                    value={profileForm.billing_address}
                    onChange={(e) => setProfileForm({ ...profileForm, billing_address: e.target.value })}
                    maxLength={150}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-70"
                    style={{ backgroundColor: COLORS.forest, color: "white" }}
                  >
                    {savingProfile && <Loader2 size={14} className="animate-spin" />}
                    Save changes
                  </button>
                  {profileSaveSuccess && (
                    <span className="text-xs" style={{ color: COLORS.leaf }}>
                      Saved.
                    </span>
                  )}
                  {profileSaveError && (
                    <span className="text-xs" style={{ color: "#b5544a" }}>
                      {profileSaveError}
                    </span>
                  )}
                </div>
              </div>
            )}
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

          {placeError && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "#faeaea", color: "#b5544a" }}>
              {placeError}
            </div>
          )}

          <button
            type="submit"
            disabled={placing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium disabled:opacity-70"
            style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
          >
            {placing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {t("buyer.checkout.placeOrder")} &middot; {formatCurrency(total, t)}
              </>
            )}
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
              <div key={item.consigned_id} className="flex items-center justify-between text-sm">
                <div>
                  <p style={{ color: COLORS.ink }}>{product(item.item_name)}</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>
                    {item.qty} &times; {currency} {item.selling_price_per_unit} &middot;{" "}
                    {t("buyer.common.via", { agent: trader(item.agent_name) })}
                  </p>
                </div>
                <p className="font-medium" style={{ color: COLORS.ink }}>
                  {currency} {(item.qty * item.selling_price_per_unit).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2" style={{ borderColor: COLORS.greige }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.sub }}>{t("buyer.common.subtotal")}</span>
              <span style={{ color: COLORS.ink }}>{currency} {subtotal.toLocaleString()}</span>
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