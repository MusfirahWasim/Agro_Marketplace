import { useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  User,
  CheckCircle2,
  Wheat,
} from "lucide-react";

/**
 * AgentCreateSale.jsx
 * Agent — create a sale for a buyer standing at the counter.
 *
 * Replaces V1's buyer self-checkout. The agent picks a buyer, adds
 * items from available consigned stock (quantity + rate per line),
 * and submits. On submit this maps to:
 *   sales (header: buyer_id, agent_id, sale_date, total_amount)
 *   sale_items (line: sale_id, consigned_id, quantity, rate, line_total)
 *   commissions (created per sale_item on completion)
 *   accounts/transactions (buyer debited, ledger updated)
 */

const MOCK_BUYERS = [
  { buyer_id: 301, name: "Rashid Traders" },
  { buyer_id: 302, name: "Fatima Provision Store" },
  { buyer_id: 303, name: "Ali Wholesale Mart" },
];

const MOCK_STOCK = [
  {
    consigned_id: 1042,
    item_name: "Basmati Rice",
    unit: "bag",
    supplier_name: "Iqbal Farms",
    quantity_remaining: 90,
    suggested_rate: 285,
  },
  {
    consigned_id: 1038,
    item_name: "Wheat",
    unit: "ton",
    supplier_name: "Chishti Estates",
    quantity_remaining: 48,
    suggested_rate: 6100,
  },
  {
    consigned_id: 1035,
    item_name: "Tomato",
    unit: "crate",
    supplier_name: "Green Valley Growers",
    quantity_remaining: 140,
    suggested_rate: 90,
  },
  {
    consigned_id: 1041,
    item_name: "Red Onion",
    unit: "crate",
    supplier_name: "Nazir Produce Co.",
    quantity_remaining: 0,
    suggested_rate: 110,
  },
];

const COMMISSION_RATE = 5; // percent, agent's standard rate

function currency(n) {
  return `Rs ${Number(n).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export default function AgentCreateSale() {
  const [buyerId, setBuyerId] = useState("");
  const [buyerQuery, setBuyerQuery] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [cart, setCart] = useState([]); // { consigned_id, item_name, unit, quantity, rate, available }
  const [paymentTerm, setPaymentTerm] = useState("credit");
  const [success, setSuccess] = useState(false);

  const buyer = MOCK_BUYERS.find((b) => b.buyer_id === Number(buyerId));

  const filteredBuyers = useMemo(() => {
    const q = buyerQuery.trim().toLowerCase();
    if (!q) return MOCK_BUYERS;
    return MOCK_BUYERS.filter((b) => b.name.toLowerCase().includes(q));
  }, [buyerQuery]);

  const filteredStock = useMemo(() => {
    const q = stockQuery.trim().toLowerCase();
    return MOCK_STOCK.filter(
      (s) =>
        s.quantity_remaining > 0 &&
        (!q ||
          s.item_name.toLowerCase().includes(q) ||
          s.supplier_name.toLowerCase().includes(q))
    );
  }, [stockQuery]);

  function addToCart(lot) {
    setCart((prev) => {
      const existing = prev.find((c) => c.consigned_id === lot.consigned_id);
      if (existing) return prev;
      return [
        ...prev,
        {
          consigned_id: lot.consigned_id,
          item_name: lot.item_name,
          unit: lot.unit,
          quantity: 1,
          rate: lot.suggested_rate,
          available: lot.quantity_remaining,
        },
      ];
    });
  }

  function updateQty(id, delta) {
    setCart((prev) =>
      prev.map((c) =>
        c.consigned_id === id
          ? {
              ...c,
              quantity: Math.max(
                1,
                Math.min(c.available, c.quantity + delta)
              ),
            }
          : c
      )
    );
  }

  function updateRate(id, rate) {
    setCart((prev) =>
      prev.map((c) =>
        c.consigned_id === id ? { ...c, rate: Number(rate) || 0 } : c
      )
    );
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((c) => c.consigned_id !== id));
  }

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.rate, 0);
  const commission = Math.round((subtotal * COMMISSION_RATE) / 100);

  function submitSale() {
    if (!buyer || cart.length === 0) return;
    setSuccess(true);
    setTimeout(() => {
      setCart([]);
      setBuyerId("");
      setSuccess(false);
    }, 1800);
  }

  return (
    <div className="min-h-full cw-bg-faf8f3 pb-16">
      <style>{`.foc-border:focus{border-color:#2f6b34;}
.foc-ring:focus{box-shadow:inset 0 0 0 1px rgba(47,107,52,0.35);}
.cw-bg-1e4620-10{background-color:rgba(30,70,32,0.1);}
.cw-bg-1e4620-30{background-color:rgba(30,70,32,0.3);}
.cw-bg-1e4620-40{background-color:rgba(30,70,32,0.4);}
.cw-bg-1e4620{background-color:#1e4620;}
.cw-bg-2f6b34-10{background-color:rgba(47,107,52,0.1);}
.cw-bg-eef1e6{background-color:#eef1e6;}
.cw-bg-f0b84c-15{background-color:rgba(240,184,76,0.15);}
.cw-bg-f0b84c{background-color:#f0b84c;}
.cw-bg-f6f5ee{background-color:#f6f5ee;}
.cw-bg-faf8f3{background-color:#faf8f3;}
.cw-border-1e4620-10{border-color:rgba(30,70,32,0.1);}
.cw-border-1e4620-15{border-color:rgba(30,70,32,0.15);}
.cw-border-1e4620-6{border-color:rgba(30,70,32,0.06);}
.cw-border-1e4620-8{border-color:rgba(30,70,32,0.08);}
.cw-border-2f6b34{border-color:#2f6b34;}
.cw-hoverbg-eef1e6:hover{background-color:#eef1e6;}
.cw-hoverbg-faf8f3:hover{background-color:#faf8f3;}
.cw-placeholdertext-a3ac9e::placeholder{color:#a3ac9e;}
.cw-ring-1e4620-10{box-shadow:inset 0 0 0 1px rgba(30,70,32,0.1);}
.cw-ring-1e4620-15{box-shadow:inset 0 0 0 1px rgba(30,70,32,0.15);}
.cw-ring-1e4620-20{box-shadow:inset 0 0 0 1px rgba(30,70,32,0.2);}
.cw-ring-1e4620-8{box-shadow:inset 0 0 0 1px rgba(30,70,32,0.08);}
.cw-ring-2f6b34-20{box-shadow:inset 0 0 0 1px rgba(47,107,52,0.2);}
.cw-ring-2f6b34-25{box-shadow:inset 0 0 0 1px rgba(47,107,52,0.25);}
.cw-ring-f0b84c-40{box-shadow:inset 0 0 0 1px rgba(240,184,76,0.4);}
.cw-text-1e4620{color:#1e4620;}
.cw-text-2f6b34{color:#2f6b34;}
.cw-text-3a2a06{color:#3a2a06;}
.cw-text-3d4a3a{color:#3d4a3a;}
.cw-text-5c6b57{color:#5c6b57;}
.cw-text-8a5a10{color:#8a5a10;}
.cw-text-8a9a86{color:#8a9a86;}
.cw-text-f0b84c{color:#f0b84c;}`}</style>
      <div className="border-b cw-border-1e4620-10 bg-white px-6 py-6 sm:px-8">
        <span className="text-xs font-medium uppercase tracking-widest cw-text-2f6b34">
          Agent · New sale
        </span>
        <h1 className="font-serif text-2xl cw-text-1e4620 sm:text-3xl">
          Create a sale
        </h1>
        <p className="mt-1 max-w-xl text-sm cw-text-5c6b57">
          Pick the buyer, add items from available consigned stock, and
          confirm. Inventory, commission, and the buyer's ledger update
          automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_380px]">
        {/* Left: buyer + stock picker */}
        <div className="space-y-6">
          {/* Buyer selector */}
          <div className="rounded-2xl bg-white p-5 shadow-sm cw-ring-1e4620-8">
            <h2 className="mb-3 flex items-center gap-2 font-serif text-lg cw-text-1e4620">
              <User className="h-4 w-4 cw-text-2f6b34" />
              Buyer
            </h2>
            {buyer ? (
              <div className="flex items-center justify-between rounded-xl cw-bg-eef1e6 px-4 py-3">
                <div>
                  <div className="text-sm font-medium cw-text-1e4620">
                    {buyer.name}
                  </div>
                  <div className="text-xs cw-text-8a9a86">
                    #{buyer.buyer_id}
                  </div>
                </div>
                <button
                  onClick={() => setBuyerId("")}
                  className="text-xs font-medium cw-text-2f6b34 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cw-text-8a9a86" />
                  <input
                    value={buyerQuery}
                    onChange={(e) => setBuyerQuery(e.target.value)}
                    placeholder="Search buyer by name"
                    className="w-full rounded-full border cw-border-1e4620-15 bg-white py-2.5 pl-9 pr-4 text-sm cw-text-1e4620 cw-placeholdertext-a3ac9e foc-border focus:outline-none foc-ring"
                  />
                </div>
                <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
                  {filteredBuyers.map((b) => (
                    <button
                      key={b.buyer_id}
                      onClick={() => setBuyerId(String(b.buyer_id))}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm cw-text-3d4a3a cw-hoverbg-faf8f3"
                    >
                      {b.name}
                      <span className="text-xs cw-text-8a9a86">
                        #{b.buyer_id}
                      </span>
                    </button>
                  ))}
                  {filteredBuyers.length === 0 && (
                    <p className="px-3 py-2 text-sm cw-text-8a9a86">
                      No buyer found.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stock picker */}
          <div className="rounded-2xl bg-white p-5 shadow-sm cw-ring-1e4620-8">
            <h2 className="mb-3 flex items-center gap-2 font-serif text-lg cw-text-1e4620">
              <Wheat className="h-4 w-4 cw-text-2f6b34" />
              Available stock
            </h2>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cw-text-8a9a86" />
              <input
                value={stockQuery}
                onChange={(e) => setStockQuery(e.target.value)}
                placeholder="Search product or supplier"
                className="w-full rounded-full border cw-border-1e4620-15 bg-white py-2.5 pl-9 pr-4 text-sm cw-text-1e4620 cw-placeholdertext-a3ac9e foc-border focus:outline-none foc-ring"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredStock.map((lot) => {
                const inCart = cart.some(
                  (c) => c.consigned_id === lot.consigned_id
                );
                return (
                  <div
                    key={lot.consigned_id}
                    className="flex flex-col justify-between rounded-xl border cw-border-1e4620-10 p-4"
                  >
                    <div>
                      <div className="text-sm font-medium cw-text-1e4620">
                        {lot.item_name}
                      </div>
                      <div className="text-xs cw-text-8a9a86">
                        {lot.supplier_name} · Lot #{lot.consigned_id}
                      </div>
                      <div className="mt-1 text-xs cw-text-5c6b57">
                        {lot.quantity_remaining} {lot.unit} available ·{" "}
                        {currency(lot.suggested_rate)}/{lot.unit}
                      </div>
                    </div>
                    <button
                      disabled={inCart}
                      onClick={() => addToCart(lot)}
                      className={`mt-3 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        inCart
                          ? "cursor-not-allowed cw-bg-eef1e6 cw-text-8a9a86"
                          : "cw-bg-1e4620 text-white hover:brightness-110"
                      }`}
                    >
                      {inCart ? "Added" : "Add to sale"}
                    </button>
                  </div>
                );
              })}
              {filteredStock.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm cw-text-8a9a86">
                  No matching stock available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: cart summary */}
        <div className="h-fit rounded-2xl bg-white p-5 shadow-sm cw-ring-1e4620-8 lg:sticky lg:top-6">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg cw-text-1e4620">
            <ShoppingCart className="h-4 w-4 cw-text-2f6b34" />
            Sale summary
          </h2>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm cw-text-8a9a86">
              No items added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {cart.map((c) => (
                <div
                  key={c.consigned_id}
                  className="rounded-xl cw-bg-f6f5ee p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium cw-text-1e4620">
                      {c.item_name}
                    </span>
                    <button
                      onClick={() => removeItem(c.consigned_id)}
                      className="cw-text-8a9a86 hover:text-red-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(c.consigned_id, -1)}
                        className="rounded-full bg-white p-1 cw-ring-1e4620-15"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 text-center text-sm">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(c.consigned_id, 1)}
                        className="rounded-full bg-white p-1 cw-ring-1e4620-15"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-xs cw-text-8a9a86">
                        {c.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs cw-text-8a9a86">Rs</span>
                      <input
                        type="number"
                        value={c.rate}
                        onChange={(e) =>
                          updateRate(c.consigned_id, e.target.value)
                        }
                        className="w-20 rounded-lg border cw-border-1e4620-15 bg-white px-2 py-1 text-right text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-1 text-right text-xs cw-text-5c6b57">
                    Line total: {currency(c.quantity * c.rate)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
              Payment term
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentTerm("cash")}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${
                  paymentTerm === "cash"
                    ? "cw-bg-1e4620 text-white"
                    : "cw-bg-eef1e6 cw-text-5c6b57"
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                Cash
              </button>
              <button
                onClick={() => setPaymentTerm("credit")}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${
                  paymentTerm === "credit"
                    ? "cw-bg-1e4620 text-white"
                    : "cw-bg-eef1e6 cw-text-5c6b57"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Credit
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl cw-bg-1e4620 p-4 text-white">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Commission ({COMMISSION_RATE}%)</span>
                <span>{currency(commission)}</span>
              </div>
              <div className="flex justify-between border-t border-white/15 pt-2 font-serif text-lg">
                <span>Total</span>
                <span>{currency(subtotal)}</span>
              </div>
            </div>

            <button
              disabled={!buyer || cart.length === 0}
              onClick={submitSale}
              className={`mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                !buyer || cart.length === 0
                  ? "cursor-not-allowed bg-white/20 text-white/50"
                  : "cw-bg-f0b84c cw-text-3a2a06 hover:brightness-95"
              }`}
            >
              {success ? "Sale recorded" : "Confirm sale"}
            </button>
          </div>

          {success && (
            <div className="mt-3 flex items-center gap-2 rounded-xl cw-bg-2f6b34-10 px-3 py-2 text-xs font-medium cw-text-2f6b34">
              <CheckCircle2 className="h-4 w-4" />
              Sale created, stock updated, receipt generated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
