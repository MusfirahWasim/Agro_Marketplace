import { useMemo, useState } from "react";
import {
  Search,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CreditCard,
  Landmark,
  PlusCircle,
  X,
} from "lucide-react";

/**
 * AgentPayments.jsx
 * Agent — record payments received from buyers and payments made to suppliers.
 *
 * Maps to `payments` (payer/payee, amount, method, reference) which in
 * turn writes a `transaction` row against `accounts` and produces a
 * `receipt`. Two tabs since the direction of money differs (in vs out)
 * even though both use the same underlying table.
 */

const MOCK_BUYERS = [
  { id: 301, name: "Rashid Traders", outstanding: 84500 },
  { id: 302, name: "Fatima Provision Store", outstanding: 0 },
  { id: 303, name: "Ali Wholesale Mart", outstanding: 152300 },
];

const MOCK_SUPPLIERS = [
  { id: 201, name: "Iqbal Farms", payable: 118000 },
  { id: 202, name: "Nazir Produce Co.", payable: 0 },
  { id: 203, name: "Chishti Estates", payable: 46200 },
];

const MOCK_PAYMENTS = [
  {
    payment_id: 5001,
    direction: "in",
    party_name: "Rashid Traders",
    amount: 40000,
    method: "cash",
    reference: "",
    date: "2026-08-30",
  },
  {
    payment_id: 5000,
    direction: "out",
    party_name: "Iqbal Farms",
    amount: 60000,
    method: "card",
    reference: "TXN-88213",
    date: "2026-08-29",
  },
  {
    payment_id: 4998,
    direction: "in",
    party_name: "Ali Wholesale Mart",
    amount: 25000,
    method: "cash",
    reference: "",
    date: "2026-08-27",
  },
  {
    payment_id: 4995,
    direction: "out",
    party_name: "Chishti Estates",
    amount: 30000,
    method: "other",
    reference: "Bank transfer ref 4471",
    date: "2026-08-25",
  },
];

const METHOD_ICON = { cash: Banknote, card: CreditCard, other: Landmark };

function currency(n) {
  return `Rs ${Number(n).toLocaleString()}`;
}

function StatCard({ icon: Icon, label, value, sub, tone = "green" }) {
  const toneMap = {
    green: "cw-bg-1e4620 text-white",
    gold: "cw-bg-f0b84c cw-text-3a2a06",
    light: "bg-white cw-text-1e4620 cw-ring-1e4620-10",
  };
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${toneMap[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide opacity-80">
          {label}
        </span>
        <Icon className="h-4 w-4 opacity-80" strokeWidth={2} />
      </div>
      <div className="mt-3 font-serif text-3xl leading-none">{value}</div>
      {sub && <div className="mt-1 text-xs opacity-70">{sub}</div>}
    </div>
  );
}

function emptyForm() {
  return { partyId: "", amount: "", method: "cash", reference: "" };
}

export default function AgentPayments() {
  const [tab, setTab] = useState("in"); // "in" = from buyers, "out" = to suppliers
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const parties = tab === "in" ? MOCK_BUYERS : MOCK_SUPPLIERS;

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => p.direction === tab)
      .filter((p) => !q || p.party_name.toLowerCase().includes(q));
  }, [payments, tab, query]);

  const totals = useMemo(() => {
    const inTotal = payments
      .filter((p) => p.direction === "in")
      .reduce((s, p) => s + p.amount, 0);
    const outTotal = payments
      .filter((p) => p.direction === "out")
      .reduce((s, p) => s + p.amount, 0);
    return { inTotal, outTotal };
  }, [payments]);

  function submitForm(e) {
    e.preventDefault();
    const party = parties.find((p) => p.id === Number(form.partyId));
    if (!party || !form.amount) return;
    const newPayment = {
      payment_id: Math.max(0, ...payments.map((p) => p.payment_id)) + 1,
      direction: tab,
      party_name: party.name,
      amount: Number(form.amount),
      method: form.method,
      reference: form.reference,
      date: new Date().toISOString().slice(0, 10),
    };
    setPayments((prev) => [newPayment, ...prev]);
    setForm(emptyForm());
    setFormOpen(false);
  }

  return (
    <div className="min-h-full cw-bg-faf8f3 pb-16">
      <div className="border-b cw-border-1e4620-10 bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest cw-text-2f6b34">
              Agent · Payments
            </span>
            <h1 className="font-serif text-2xl cw-text-1e4620 sm:text-3xl">
              Payments
            </h1>
            <p className="mt-1 max-w-xl text-sm cw-text-5c6b57">
              Record what a buyer pays you, or what you pay a supplier.
              Every entry updates their outstanding balance and creates
              a receipt.
            </p>
          </div>
          <button
            onClick={() => {
              setForm(emptyForm());
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 self-start rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
          >
            <PlusCircle className="h-4 w-4" />
            Record payment
          </button>
        </div>
      </div>

      <div className="px-6 sm:px-8">
        {/* Green spotlight — mirrors the dashboard's "Owed to suppliers" accent card */}
        <div className="mt-6 rounded-2xl cw-bg-1e4620 p-6 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 cw-text-f0b84c" />
            <h3 className="font-serif text-lg">Owed to suppliers</h3>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {MOCK_SUPPLIERS.reduce((s, x) => s + x.payable, 0) > 0
              ? `${currency(
                  MOCK_SUPPLIERS.reduce((s, x) => s + x.payable, 0)
                )} still to settle across your suppliers.`
              : "Nothing outstanding right now."}
          </p>
          <button
            onClick={() => {
              setTab("out");
              setForm(emptyForm());
              setFormOpen(true);
            }}
            className="mt-4 w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95 sm:w-auto"
          >
            Settle now
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={ArrowDownCircle}
            label="Received from buyers"
            value={currency(totals.inTotal)}
            sub="All time"
            tone="green"
          />
          <StatCard
            icon={ArrowUpCircle}
            label="Paid to suppliers"
            value={currency(totals.outTotal)}
            sub="All time"
            tone="gold"
          />
          <StatCard
            icon={Wallet}
            label="Buyers owe you"
            value={currency(
              MOCK_BUYERS.reduce((s, b) => s + b.outstanding, 0)
            )}
            tone="light"
          />
          <StatCard
            icon={Wallet}
            label="You owe suppliers"
            value={currency(
              MOCK_SUPPLIERS.reduce((s, s2) => s + s2.payable, 0)
            )}
            tone="light"
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-2">
          <button
            onClick={() => setTab("in")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "in"
                ? "cw-bg-1e4620 text-white"
                : "bg-white cw-text-5c6b57 cw-ring-1e4620-10 cw-hoverbg-eef1e6"
            }`}
          >
            From buyers
          </button>
          <button
            onClick={() => setTab("out")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "out"
                ? "cw-bg-1e4620 text-white"
                : "bg-white cw-text-5c6b57 cw-ring-1e4620-10 cw-hoverbg-eef1e6"
            }`}
          >
            To suppliers
          </button>
        </div>

        <div className="mt-4 relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cw-text-8a9a86" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "in" ? "Search buyer name" : "Search supplier name"
            }
            className="w-full rounded-full border cw-border-1e4620-15 bg-white py-2.5 pl-9 pr-4 text-sm cw-text-1e4620 cw-placeholdertext-a3ac9e foc-border focus:outline-none foc-ring"
          />
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm cw-ring-1e4620-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b cw-border-1e4620-8 cw-bg-f6f5ee text-xs uppercase tracking-wide cw-text-5c6b57">
                <th className="px-5 py-3 font-medium">
                  {tab === "in" ? "Buyer" : "Supplier"}
                </th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const Icon = METHOD_ICON[p.method];
                return (
                  <tr
                    key={p.payment_id}
                    className="border-b cw-border-1e4620-6 last:border-0 cw-hoverbg-faf8f3"
                  >
                    <td className="px-5 py-4 font-medium cw-text-1e4620">
                      {p.party_name}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          tab === "in"
                            ? "font-medium cw-text-2f6b34"
                            : "font-medium cw-text-8a5a10"
                        }
                      >
                        {tab === "in" ? "+" : "-"}
                        {currency(p.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs capitalize cw-text-5c6b57">
                        <Icon className="h-3.5 w-3.5" />
                        {p.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs cw-text-8a9a86">
                      {p.reference || "—"}
                    </td>
                    <td className="px-5 py-4 cw-text-3d4a3a">{p.date}</td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 cw-text-8a9a86">
                      <Wallet className="h-6 w-6" />
                      <p className="text-sm font-medium cw-text-3d4a3a">
                        No payments yet
                      </p>
                      <p className="text-xs">
                        Record one with the button above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record payment drawer */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end cw-bg-1e4620-30 backdrop-blur-[2px]">
          <div className="h-full w-full max-w-md overflow-y-auto cw-bg-faf8f3 shadow-2xl">
            <div className="flex items-center justify-between border-b cw-border-1e4620-10 bg-white px-6 py-5">
              <div>
                <span className="text-xs uppercase tracking-widest cw-text-2f6b34">
                  New payment
                </span>
                <h2 className="font-serif text-xl cw-text-1e4620">
                  Record {tab === "in" ? "buyer" : "supplier"} payment
                </h2>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-full p-2 cw-text-5c6b57 cw-hoverbg-eef1e6"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submitForm} className="space-y-4 px-6 py-6">
              <div className="flex gap-2 rounded-full cw-bg-eef1e6 p-1">
                <button
                  type="button"
                  onClick={() => setTab("in")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-medium ${
                    tab === "in"
                      ? "bg-white cw-text-1e4620 shadow-sm"
                      : "cw-text-5c6b57"
                  }`}
                >
                  From buyer
                </button>
                <button
                  type="button"
                  onClick={() => setTab("out")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-medium ${
                    tab === "out"
                      ? "bg-white cw-text-1e4620 shadow-sm"
                      : "cw-text-5c6b57"
                  }`}
                >
                  To supplier
                </button>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  {tab === "in" ? "Buyer" : "Supplier"}
                </span>
                <select
                  required
                  value={form.partyId}
                  onChange={(e) =>
                    setForm({ ...form, partyId: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select {tab === "in" ? "buyer" : "supplier"}</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} —{" "}
                      {tab === "in"
                        ? `owes ${currency(p.outstanding)}`
                        : `payable ${currency(p.payable)}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  Amount (Rs)
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  className="input"
                  placeholder="0"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  Method
                </span>
                <select
                  value={form.method}
                  onChange={(e) =>
                    setForm({ ...form, method: e.target.value })
                  }
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="other">Other (bank transfer, etc.)</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  Reference (optional)
                </span>
                <input
                  value={form.reference}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
                  }
                  className="input"
                  placeholder="Transaction / cheque number"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
              >
                Save payment & generate receipt
              </button>
            </form>
          </div>
        </div>
      )}

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
.cw-text-f0b84c{color:#f0b84c;}
.input{width:100%;border-radius:0.75rem;border:1px solid rgba(30,70,32,0.15);background:white;padding:0.6rem 0.9rem;font-size:0.875rem;color:#1e4620}.input:focus{outline:none;border-color:#2f6b34;box-shadow:0 0 0 3px rgba(47,107,52,0.15)}`}</style>
    </div>
  );
}
