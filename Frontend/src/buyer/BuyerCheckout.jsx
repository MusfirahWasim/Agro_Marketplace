import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, CreditCard, MapPin, CheckCircle2 } from "lucide-react";

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
  const cartItems = location.state?.cartItems || [];

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [address, setAddress] = useState("Shop 8, DHA Phase 5, Karachi");
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

  // nothing to check out — send the buyer back to the marketplace
  if (cartItems.length === 0 && !placed) {
    return (
      <div className="font-body flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: COLORS.cream }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Fraunces', serif; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}</style>
        <h1 className="font-display text-2xl mb-2" style={{ color: COLORS.ink }}>
          Your cart is empty
        </h1>
        <p className="text-sm mb-6" style={{ color: COLORS.sub }}>
          Add some products from the marketplace before checking out.
        </p>
        <button
          onClick={() => navigate("/buyer/marketplace")}
          className="px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: COLORS.forest, color: "white" }}
        >
          Back to marketplace
        </button>
      </div>
    );
  }

  // order confirmed screen
  if (placed) {
    return (
      <div className="font-body flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: COLORS.cream }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Fraunces', serif; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}</style>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: "#eaf1e4" }}
        >
          <CheckCircle2 size={30} color={COLORS.leaf} />
        </div>
        <h1 className="font-display text-2xl mb-2" style={{ color: COLORS.ink }}>
          Order placed successfully
        </h1>
        <p className="text-sm mb-6 max-w-sm" style={{ color: COLORS.sub }}>
          Your order totaling Rs {total.toLocaleString()} has been sent to the respective
          commission agents. You can track its status from My orders.
        </p>
        <button
          onClick={() => navigate("/buyer/orders")}
          className="px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
        >
          View my orders
        </button>
      </div>
    );
  }

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* header */}
      <button
        onClick={() => navigate("/buyer/marketplace")}
        className="flex items-center gap-1.5 text-sm font-medium mb-4"
        style={{ color: COLORS.sub }}
      >
        <ArrowLeft size={15} />
        Back to marketplace
      </button>

      <h1 className="font-display text-2xl sm:text-3xl mb-1" style={{ color: COLORS.ink }}>
        Checkout
      </h1>
      <p className="text-sm mb-8" style={{ color: COLORS.sub }}>
        Review your order and confirm delivery and payment details.
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
                Delivery details
              </h2>
            </div>

            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
              Delivery address
            </label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none mb-4"
              style={{ borderColor: COLORS.border }}
            />

            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
              Notes for the agent (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. preferred delivery time"
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
                Payment method
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
                  <p className="text-sm font-medium" style={{ color: COLORS.ink }}>Cash</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>Pay on delivery</p>
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
                  <p className="text-sm font-medium" style={{ color: COLORS.ink }}>Credit</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>Settle later as dues</p>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
          >
            Place order &middot; Rs {total.toLocaleString()}
          </button>
        </form>

        {/* right column — order summary */}
        <div
          className="rounded-xl border p-6 h-fit"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <h2 className="font-display text-lg mb-4" style={{ color: COLORS.ink }}>
            Order summary
          </h2>

          <div className="flex flex-col gap-3 mb-5">
            {cartItems.map((item) => (
              <div key={item.consignId} className="flex items-center justify-between text-sm">
                <div>
                  <p style={{ color: COLORS.ink }}>{item.product}</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>
                    {item.qty} &times; Rs {item.price} &middot; via {item.agent}
                  </p>
                </div>
                <p className="font-medium" style={{ color: COLORS.ink }}>
                  Rs {(item.qty * item.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2" style={{ borderColor: COLORS.greige }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.sub }}>Subtotal</span>
              <span style={{ color: COLORS.ink }}>Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.sub }}>Service fee</span>
              <span style={{ color: COLORS.ink }}>Rs {serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: COLORS.greige }}>
              <span className="font-medium" style={{ color: COLORS.ink }}>Total</span>
              <span className="font-display text-xl" style={{ color: COLORS.ink }}>
                Rs {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}