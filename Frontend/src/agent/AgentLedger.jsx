import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  User,
  Sprout,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  Wallet,
} from "lucide-react";

/**
 * AgentLedger.jsx
 * Agent — per-buyer / per-supplier statement.
 *
 * Aggregates `transactions` rows against `accounts` for a single party
 * (debit, credit, running balance), sourced from `sales`, `payments`,
 * and `commissions`. Replaces V1's SupplierReports.jsx: in V2 the agent
 * is the one who needs the full statement, for either side of the
 * ledger, not just suppliers.
 */

const PARTIES = [
  { id: "B-301", type: "buyer", name: "Rashid Traders" },
  { id: "B-302", type: "buyer", name: "Fatima Provision Store" },
  { id: "B-303", type: "buyer", name: "Ali Wholesale Mart" },
  { id: "S-201", type: "supplier", name: "Iqbal Farms" },
  { id: "S-202", type: "supplier", name: "Nazir Produce Co." },
  { id: "S-203", type: "supplier", name: "Chishti Estates" },
];

const MOCK_TRANSACTIONS = {
  "B-301": [
    { date: "2026-08-05", desc: "Sale #7741 — Basmati Rice x40 bags", debit: 55200, credit: 0 },
    { date: "2026-08-18", desc: "Payment received (cash)", debit: 0, credit: 30000 },
    { date: "2026-08-22", desc: "Sale #7799 — Wheat x10 ton", debit: 61000, credit: 0 },
    { date: "2026-08-30", desc: "Payment received (cash)", debit: 0, credit: 40000 },
  ],
  "B-302": [
    { date: "2026-07-14", desc: "Sale #7601 — Tomato x30 crate", debit: 2700, credit: 0 },
    { date: "2026-07-15", desc: "Payment received (cash)", debit: 0, credit: 2700 },
  ],
  "B-303": [
    { date: "2026-08-01", desc: "Sale #7710 — Red Onion x120 crate", debit: 13200, credit: 0 },
    { date: "2026-08-10", desc: "Sale #7735 — Basmati Rice x50 bags", debit: 141550, credit: 0 },
    { date: "2026-08-27", desc: "Payment received (cash)", debit: 0, credit: 25000 },
  ],
  "S-201": [
    { date: "2026-08-02", desc: "Consignment #1029 — Potato x500 bags handed over", debit: 0, credit: 0 },
    { date: "2026-08-20", desc: "Sales settled — commission deducted", debit: 0, credit: 178000 },
    { date: "2026-08-29", desc: "Payment made (card)", debit: 60000, credit: 0 },
  ],
  "S-202": [
    { date: "2026-07-12", desc: "Consignment #1041 — Red Onion x250 crate handed over", debit: 0, credit: 0 },
    { date: "2026-07-20", desc: "Sales settled — commission deducted", debit: 0, credit: 27500 },
    { date: "2026-07-21", desc: "Payment made (cash)", debit: 27500, credit: 0 },
  ],
  "S-203": [
    { date: "2026-07-09", desc: "Consignment #1038 — Wheat x60 ton handed over", debit: 0, credit: 0 },
    { date: "2026-08-22", desc: "Sales settled — commission deducted", debit: 0, credit: 76200 },
    { date: "2026-08-25", desc: "Payment made (other)", debit: 30000, credit: 0 },
  ],
};

function currency(n) {
  return `Rs ${Number(n).toLocaleString()}`;
}

function withRunningBalance(rows) {
  let balance = 0;
  return rows.map((r) => {
    balance += r.credit - r.debit;
    // For a buyer: debit (sale) increases what they owe, credit (payment) reduces it.
    // For a supplier: credit (settlement due) increases what we owe, debit (payment) reduces it.
    return { ...r, running_balance: balance };
  });
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

export default function AgentLedger() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(PARTIES[0].id);

  const filteredParties = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PARTIES;
    return PARTIES.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const selectedParty = PARTIES.find((p) => p.id === selectedId);
  const rows = useMemo(
    () => withRunningBalance(MOCK_TRANSACTIONS[selectedId] || []),
    [selectedId]
  );

  const totals = useMemo(() => {
    const debit = rows.reduce((s, r) => s + r.debit, 0);
    const credit = rows.reduce((s, r) => s + r.credit, 0);
    const balance = rows.length ? rows[rows.length - 1].running_balance : 0;
    return { debit, credit, balance };
  }, [rows]);

  const isBuyer = selectedParty?.type === "buyer";
  const balanceLabel = isBuyer ? "Owes you" : "You owe";

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
          Agent · Ledger
        </span>
        <h1 className="font-serif text-2xl cw-text-1e4620 sm:text-3xl">
          Party statement
        </h1>
        <p className="mt-1 max-w-xl text-sm cw-text-5c6b57">
          Pick a buyer or supplier to see their full transaction history
          and running balance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[280px_1fr]">
        {/* Party list */}
        <div className="rounded-2xl bg-white p-4 shadow-sm cw-ring-1e4620-8 lg:h-fit lg:sticky lg:top-6">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cw-text-8a9a86" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buyer or supplier"
              className="w-full rounded-full border cw-border-1e4620-15 bg-white py-2 pl-9 pr-3 text-sm cw-text-1e4620 cw-placeholdertext-a3ac9e foc-border focus:outline-none foc-ring"
            />
          </div>
          <div className="max-h-[420px] space-y-1 overflow-y-auto">
            {filteredParties.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedId === p.id
                    ? "cw-bg-1e4620 text-white"
                    : "cw-text-3d4a3a cw-hoverbg-faf8f3"
                }`}
              >
                {p.type === "buyer" ? (
                  <User className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Sprout className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{p.name}</span>
                <span
                  className={`ml-auto shrink-0 text-[10px] uppercase tracking-wide ${
                    selectedId === p.id ? "text-white/70" : "cw-text-8a9a86"
                  }`}
                >
                  {p.type}
                </span>
              </button>
            ))}
            {filteredParties.length === 0 && (
              <p className="px-3 py-4 text-center text-sm cw-text-8a9a86">
                No match found.
              </p>
            )}
          </div>
        </div>

        {/* Statement */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-xl cw-text-1e4620">
                {selectedParty?.name}
              </h2>
              <p className="text-xs cw-text-8a9a86 capitalize">
                {selectedParty?.type} · {selectedParty?.id}
              </p>
            </div>
            <button className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-xs font-medium cw-text-1e4620 cw-ring-1e4620-15 cw-hoverbg-eef1e6">
              <Printer className="h-3.5 w-3.5" />
              Print statement
            </button>
          </div>

          {/* Green spotlight — mirrors the dashboard's accent card style */}
          <div className="mt-4 rounded-2xl cw-bg-1e4620 p-6 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 cw-text-f0b84c" />
              <h3 className="font-serif text-lg">
                {balanceLabel} {currency(Math.abs(totals.balance))}
              </h3>
            </div>
            <p className="mt-1 text-sm text-white/70">
              {totals.balance === 0
                ? "This account is fully settled."
                : isBuyer
                ? "Outstanding since their last purchase."
                : "Still to be settled from your side."}
            </p>
            <button className="mt-4 w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95 sm:w-auto">
              {isBuyer ? "Record a payment" : "Settle now"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatCard
              icon={ArrowDownCircle}
              label={isBuyer ? "Total billed" : "Total settled"}
              value={currency(totals.debit || 0)}
              tone="light"
            />
            <StatCard
              icon={ArrowUpCircle}
              label={isBuyer ? "Total received" : "Total paid"}
              value={currency(totals.credit)}
              tone="light"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm cw-ring-1e4620-8">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b cw-border-1e4620-8 cw-bg-f6f5ee text-xs uppercase tracking-wide cw-text-5c6b57">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium text-right">Debit</th>
                  <th className="px-5 py-3 font-medium text-right">Credit</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b cw-border-1e4620-6 last:border-0"
                  >
                    <td className="px-5 py-3 cw-text-3d4a3a">{r.date}</td>
                    <td className="px-5 py-3 cw-text-3d4a3a">{r.desc}</td>
                    <td className="px-5 py-3 text-right cw-text-8a5a10">
                      {r.debit ? currency(r.debit) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right cw-text-2f6b34">
                      {r.credit ? currency(r.credit) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium cw-text-1e4620">
                      {currency(r.running_balance)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 cw-text-8a9a86">
                        <BookOpen className="h-6 w-6" />
                        <p className="text-sm font-medium cw-text-3d4a3a">
                          No transactions yet
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
