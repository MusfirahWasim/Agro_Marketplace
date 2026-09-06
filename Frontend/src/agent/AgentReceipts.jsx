import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Receipt,
  Printer,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

/**
 * AgentReceipts.jsx
 * Agent — view and print receipts.
 *
 * Maps to `receipts`, one row generated automatically per `payment`.
 * Read-only screen: receipts aren't edited, only viewed/printed.
 */

const MOCK_RECEIPTS = [
  {
    receipt_id: "RCT-5001",
    direction: "in",
    party_name: "Rashid Traders",
    amount: 40000,
    method: "cash",
    date: "2026-08-30",
    balance_after: 44500,
  },
  {
    receipt_id: "RCT-5000",
    direction: "out",
    party_name: "Iqbal Farms",
    amount: 60000,
    method: "card",
    date: "2026-08-29",
    balance_after: 58000,
  },
  {
    receipt_id: "RCT-4998",
    direction: "in",
    party_name: "Ali Wholesale Mart",
    amount: 25000,
    method: "cash",
    date: "2026-08-27",
    balance_after: 127300,
  },
  {
    receipt_id: "RCT-4995",
    direction: "out",
    party_name: "Chishti Estates",
    amount: 30000,
    method: "other",
    date: "2026-08-25",
    balance_after: 16200,
  },
  {
    receipt_id: "RCT-4990",
    direction: "in",
    party_name: "Rashid Traders",
    amount: 30000,
    method: "cash",
    date: "2026-08-18",
    balance_after: 84500,
  },
];

const FILTERS = ["all", "in", "out"];
const FILTER_LABEL = { all: "All receipts", in: "From buyers", out: "To suppliers" };

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

export default function AgentReceipts() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return MOCK_RECEIPTS.filter((r) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        r.party_name.toLowerCase().includes(q) ||
        r.receipt_id.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || r.direction === filter;
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  const totals = useMemo(() => {
    const inTotal = MOCK_RECEIPTS.filter((r) => r.direction === "in").reduce(
      (s, r) => s + r.amount,
      0
    );
    const outTotal = MOCK_RECEIPTS.filter((r) => r.direction === "out").reduce(
      (s, r) => s + r.amount,
      0
    );
    return { inTotal, outTotal };
  }, []);

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
          Agent · Receipts
        </span>
        <h1 className="font-serif text-2xl cw-text-1e4620 sm:text-3xl">
          Receipts
        </h1>
        <p className="mt-1 max-w-xl text-sm cw-text-5c6b57">
          A receipt is generated automatically for every payment. View or
          print any of them here.
        </p>
      </div>

      <div className="px-6 sm:px-8">
        {/* Green spotlight — mirrors the dashboard's accent card style */}
        <div className="mt-6 rounded-2xl cw-bg-1e4620 p-6 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 cw-text-f0b84c" />
            <h3 className="font-serif text-lg">This week's activity</h3>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {currency(totals.inTotal)} received, {currency(totals.outTotal)}{" "}
            paid out across {MOCK_RECEIPTS.length} receipts.
          </p>
          <button className="mt-4 w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95 sm:w-auto">
            View all payments
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Receipt}
            label="Total receipts"
            value={MOCK_RECEIPTS.length}
            tone="green"
          />
          <StatCard
            icon={ArrowDownCircle}
            label="Received"
            value={currency(totals.inTotal)}
            tone="gold"
          />
          <StatCard
            icon={ArrowUpCircle}
            label="Paid out"
            value={currency(totals.outTotal)}
            tone="light"
          />
          <StatCard
            icon={Receipt}
            label="This week"
            value={MOCK_RECEIPTS.filter((r) => r.date >= "2026-08-25").length}
            tone="light"
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cw-text-8a9a86" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search receipt ID or party"
              className="w-full rounded-full border cw-border-1e4620-15 bg-white py-2.5 pl-9 pr-4 text-sm cw-text-1e4620 cw-placeholdertext-a3ac9e foc-border focus:outline-none foc-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 cw-text-5c6b57" />
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "cw-bg-1e4620 text-white"
                    : "bg-white cw-text-5c6b57 cw-ring-1e4620-10 cw-hoverbg-eef1e6"
                }`}
              >
                {FILTER_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Table desktop */}
        <div className="mt-6 hidden overflow-hidden rounded-2xl bg-white shadow-sm cw-ring-1e4620-8 lg:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b cw-border-1e4620-8 cw-bg-f6f5ee text-xs uppercase tracking-wide cw-text-5c6b57">
                <th className="px-5 py-3 font-medium">Receipt</th>
                <th className="px-5 py-3 font-medium">Party</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.receipt_id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-b cw-border-1e4620-6 last:border-0 cw-hoverbg-faf8f3"
                >
                  <td className="px-5 py-4 font-medium cw-text-1e4620">
                    {r.receipt_id}
                  </td>
                  <td className="px-5 py-4 cw-text-3d4a3a">
                    {r.party_name}
                    <span className="ml-2 text-xs cw-text-8a9a86">
                      {r.direction === "in" ? "(buyer)" : "(supplier)"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        r.direction === "in"
                          ? "font-medium cw-text-2f6b34"
                          : "font-medium cw-text-8a5a10"
                      }
                    >
                      {r.direction === "in" ? "+" : "-"}
                      {currency(r.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-4 cw-text-3d4a3a">{r.date}</td>
                  <td className="px-5 py-4 text-right text-xs font-medium cw-text-2f6b34">
                    View
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <EmptyRow />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="mt-6 space-y-3 lg:hidden">
          {filtered.map((r) => (
            <button
              key={r.receipt_id}
              onClick={() => setSelected(r)}
              className="w-full rounded-2xl bg-white p-4 text-left shadow-sm cw-ring-1e4620-8 active:cw-bg-faf8f3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-base cw-text-1e4620">
                    {r.receipt_id}
                  </div>
                  <div className="text-xs cw-text-8a9a86">
                    {r.party_name}
                  </div>
                </div>
                <span
                  className={
                    r.direction === "in"
                      ? "font-medium cw-text-2f6b34"
                      : "font-medium cw-text-8a5a10"
                  }
                >
                  {r.direction === "in" ? "+" : "-"}
                  {currency(r.amount)}
                </span>
              </div>
              <div className="mt-2 text-xs cw-text-8a9a86">{r.date}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm cw-ring-1e4620-8">
              <EmptyRow />
            </div>
          )}
        </div>
      </div>

      {/* Printable receipt modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center cw-bg-1e4620-40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashed cw-border-1e4620-15 px-6 py-4">
              <span className="font-serif text-lg cw-text-1e4620">
                AISAMMS Receipt
              </span>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 cw-text-5c6b57 cw-hoverbg-eef1e6"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest cw-text-8a9a86">
                  Receipt No.
                </div>
                <div className="font-serif text-2xl cw-text-1e4620">
                  {selected.receipt_id}
                </div>
              </div>

              <div className="space-y-2 border-y border-dashed cw-border-1e4620-15 py-4 text-sm">
                <Row label="Direction" value={selected.direction === "in" ? "Received from buyer" : "Paid to supplier"} />
                <Row label="Party" value={selected.party_name} />
                <Row label="Method" value={selected.method} capitalize />
                <Row label="Date" value={selected.date} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm cw-text-5c6b57">Amount</span>
                <span className="font-serif text-2xl cw-text-1e4620">
                  {currency(selected.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs cw-text-8a9a86">
                <span>Balance after this transaction</span>
                <span>{currency(selected.balance_after)}</span>
              </div>

              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-full cw-bg-1e4620 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
                <Printer className="h-4 w-4" />
                Print receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between">
      <span className="cw-text-8a9a86">{label}</span>
      <span className={`font-medium cw-text-1e4620 ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="flex flex-col items-center gap-2 cw-text-8a9a86">
      <Receipt className="h-6 w-6" />
      <p className="text-sm font-medium cw-text-3d4a3a">No receipts match</p>
      <p className="text-xs">Try a different search term or filter.</p>
    </div>
  );
}
