import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Wheat,
  PackageCheck,
  PackageOpen,
  Clock3,
  X,
  ChevronRight,
  Banknote,
  CreditCard,
} from "lucide-react";

/**
 * AgentInventory.jsx
 * Commission Agent — consigned inventory view.
 *
 * Maps directly to `supplier_agent_consignment`:
 * consigned_id, supply_id, supplier_id, quantity_consigned,
 * quantity_sold, quantity_remaining, payment_term, status, consigned_at.
 *
 * Each lot is shown as a "grain sack" fill — sold portion drains from
 * gold to green, giving the agent an instant read on sell-through
 * without reading numbers first.
 */

// ---------------------------------------------------------------------
// Mock data — shape matches supplier_agent_consignment (+ joined fields
// from supplies/parties that the API would resolve server-side).
// ---------------------------------------------------------------------
const MOCK_CONSIGNMENTS = [
  {
    consigned_id: 1042,
    item_name: "Basmati Rice",
    unit: "bag",
    supplier_name: "Iqbal Farms",
    quantity_consigned: 400,
    quantity_sold: 310,
    quantity_remaining: 90,
    payment_term: "credit",
    status: "confirmed",
    consigned_at: "2026-07-14",
  },
  {
    consigned_id: 1041,
    item_name: "Red Onion",
    unit: "crate",
    supplier_name: "Nazir Produce Co.",
    quantity_consigned: 250,
    quantity_sold: 250,
    quantity_remaining: 0,
    payment_term: "cash",
    status: "completed",
    consigned_at: "2026-07-12",
  },
  {
    consigned_id: 1038,
    item_name: "Wheat",
    unit: "ton",
    supplier_name: "Chishti Estates",
    quantity_consigned: 60,
    quantity_sold: 12,
    quantity_remaining: 48,
    payment_term: "credit",
    status: "confirmed",
    consigned_at: "2026-07-09",
  },
  {
    consigned_id: 1035,
    item_name: "Tomato",
    unit: "crate",
    supplier_name: "Green Valley Growers",
    quantity_consigned: 180,
    quantity_sold: 40,
    quantity_remaining: 140,
    payment_term: "cash",
    status: "pending",
    consigned_at: "2026-07-08",
  },
  {
    consigned_id: 1029,
    item_name: "Potato",
    unit: "bag",
    supplier_name: "Iqbal Farms",
    quantity_consigned: 500,
    quantity_sold: 500,
    quantity_remaining: 0,
    payment_term: "credit",
    status: "completed",
    consigned_at: "2026-07-02",
  },
  {
    consigned_id: 1024,
    item_name: "Green Chili",
    unit: "crate",
    supplier_name: "Nazir Produce Co.",
    quantity_consigned: 90,
    quantity_sold: 15,
    quantity_remaining: 75,
    payment_term: "cash",
    status: "cancelled",
    consigned_at: "2026-06-28",
  },
];

const STATUS_STYLES = {
  pending: "bg-[#f0b84c]/15 text-[#8a5a10] ring-1 ring-[#f0b84c]/40",
  confirmed: "bg-[#2f6b34]/10 text-[#2f6b34] ring-1 ring-[#2f6b34]/25",
  completed: "bg-[#1e4620]/10 text-[#1e4620] ring-1 ring-[#1e4620]/20",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Active",
  completed: "Settled",
  cancelled: "Cancelled",
};

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

function sellThrough(lot) {
  if (lot.quantity_consigned === 0) return 0;
  return Math.round((lot.quantity_sold / lot.quantity_consigned) * 100);
}

function GrainFill({ pct }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#eef1e6]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#f0b84c] to-[#2f6b34] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "green" }) {
  const toneMap = {
    green: "bg-[#1e4620] text-white",
    gold: "bg-[#f0b84c] text-[#3a2a06]",
    light: "bg-white text-[#1e4620] ring-1 ring-[#1e4620]/10",
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

export default function AgentInventory() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return MOCK_CONSIGNMENTS.filter((lot) => {
      const matchesStatus =
        statusFilter === "all" || lot.status === statusFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        lot.item_name.toLowerCase().includes(q) ||
        lot.supplier_name.toLowerCase().includes(q) ||
        String(lot.consigned_id).includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const totals = useMemo(() => {
    const consigned = MOCK_CONSIGNMENTS.reduce(
      (s, l) => s + l.quantity_consigned,
      0
    );
    const sold = MOCK_CONSIGNMENTS.reduce((s, l) => s + l.quantity_sold, 0);
    const remaining = MOCK_CONSIGNMENTS.reduce(
      (s, l) => s + l.quantity_remaining,
      0
    );
    const activeLots = MOCK_CONSIGNMENTS.filter(
      (l) => l.status === "confirmed" || l.status === "pending"
    ).length;
    return { consigned, sold, remaining, activeLots };
  }, []);

  const settledPendingCount = MOCK_CONSIGNMENTS.filter(
    (l) => l.status === "completed"
  ).length;

  return (
    <div className="min-h-full bg-[#faf8f3] pb-16">
      {/* Header */}
      <div className="border-b border-[#1e4620]/10 bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[#2f6b34]">
            Agent · Inventory
          </span>
          <h1 className="font-serif text-2xl text-[#1e4620] sm:text-3xl">
            Consigned inventory
          </h1>
          <p className="max-w-xl text-sm text-[#5c6b57]">
            Every lot handed to you by a supplier, with what's sold and
            what's still on hand. Ownership stays with the supplier until
            it's sold and settled.
          </p>
        </div>
      </div>

      <div className="px-6 sm:px-8">
        {/* Green spotlight — mirrors the dashboard's "Owed to suppliers" accent card */}
        <div className="mt-6 rounded-2xl bg-[#1e4620] p-6 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-[#f0b84c]" />
            <h3 className="font-serif text-lg">Lots ready to settle</h3>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {settledPendingCount > 0
              ? `${settledPendingCount} completed lot${
                  settledPendingCount > 1 ? "s" : ""
                } waiting on a supplier settlement.`
              : "Nothing waiting on settlement right now."}
          </p>
          <button className="mt-4 w-full rounded-full bg-[#f0b84c] px-5 py-2.5 text-sm font-semibold text-[#3a2a06] hover:brightness-95 sm:w-auto">
            Settle now
          </button>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Wheat}
            label="Consigned lots"
            value={MOCK_CONSIGNMENTS.length}
            sub={`${totals.activeLots} active`}
            tone="green"
          />
          <StatCard
            icon={PackageCheck}
            label="Units sold"
            value={totals.sold.toLocaleString()}
            sub="Across all lots"
            tone="gold"
          />
          <StatCard
            icon={PackageOpen}
            label="Units remaining"
            value={totals.remaining.toLocaleString()}
            sub="On hand, unsold"
            tone="light"
          />
          <StatCard
            icon={Clock3}
            label="Sell-through"
            value={`${
              totals.consigned
                ? Math.round((totals.sold / totals.consigned) * 100)
                : 0
            }%`}
            sub="Of consigned stock"
            tone="light"
          />
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9a86]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product, supplier, or lot ID"
              className="w-full rounded-full border border-[#1e4620]/15 bg-white py-2.5 pl-9 pr-4 text-sm text-[#1e4620] placeholder:text-[#a3ac9e] focus:border-[#2f6b34] focus:outline-none focus:ring-2 focus:ring-[#2f6b34]/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#5c6b57]" />
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === f
                    ? "bg-[#1e4620] text-white"
                    : "bg-white text-[#5c6b57] ring-1 ring-[#1e4620]/10 hover:bg-[#eef1e6]"
                }`}
              >
                {f === "all" ? "All lots" : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Table (desktop) */}
        <div className="mt-6 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#1e4620]/8 lg:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1e4620]/8 bg-[#f6f5ee] text-xs uppercase tracking-wide text-[#5c6b57]">
                <th className="px-5 py-3 font-medium">Lot</th>
                <th className="px-5 py-3 font-medium">Supplier</th>
                <th className="px-5 py-3 font-medium">Consigned</th>
                <th className="px-5 py-3 font-medium">Sell-through</th>
                <th className="px-5 py-3 font-medium">Terms</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lot) => {
                const pct = sellThrough(lot);
                return (
                  <tr
                    key={lot.consigned_id}
                    onClick={() => setSelected(lot)}
                    className="cursor-pointer border-b border-[#1e4620]/6 last:border-0 hover:bg-[#faf8f3]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#1e4620]">
                        {lot.item_name}
                      </div>
                      <div className="text-xs text-[#8a9a86]">
                        #{lot.consigned_id} · {lot.consigned_at}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#3d4a3a]">
                      {lot.supplier_name}
                    </td>
                    <td className="px-5 py-4 text-[#3d4a3a]">
                      {lot.quantity_consigned} {lot.unit}
                      <div className="text-xs text-[#8a9a86]">
                        {lot.quantity_sold} sold · {lot.quantity_remaining}{" "}
                        left
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-28">
                          <GrainFill pct={pct} />
                        </div>
                        <span className="text-xs font-medium text-[#3d4a3a]">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#5c6b57]">
                        {lot.payment_term === "cash" ? (
                          <Banknote className="h-3.5 w-3.5" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5" />
                        )}
                        {lot.payment_term === "cash" ? "Cash" : "Credit"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[lot.status]
                        }`}
                      >
                        {STATUS_LABEL[lot.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-[#8a9a86]" />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <EmptyRow />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="mt-6 space-y-3 lg:hidden">
          {filtered.map((lot) => {
            const pct = sellThrough(lot);
            return (
              <button
                key={lot.consigned_id}
                onClick={() => setSelected(lot)}
                className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-[#1e4620]/8 active:bg-[#faf8f3]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-serif text-base text-[#1e4620]">
                      {lot.item_name}
                    </div>
                    <div className="text-xs text-[#8a9a86]">
                      #{lot.consigned_id} · {lot.supplier_name}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLES[lot.status]
                    }`}
                  >
                    {STATUS_LABEL[lot.status]}
                  </span>
                </div>
                <div className="mt-3">
                  <GrainFill pct={pct} />
                  <div className="mt-1.5 flex justify-between text-xs text-[#5c6b57]">
                    <span>
                      {lot.quantity_sold}/{lot.quantity_consigned}{" "}
                      {lot.unit} sold
                    </span>
                    <span>{pct}%</span>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#1e4620]/8">
              <EmptyRow />
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1e4620]/30 backdrop-blur-[2px]">
          <div className="h-full w-full max-w-md overflow-y-auto bg-[#faf8f3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e4620]/10 bg-white px-6 py-5">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#2f6b34]">
                  Lot #{selected.consigned_id}
                </span>
                <h2 className="font-serif text-xl text-[#1e4620]">
                  {selected.item_name}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-2 text-[#5c6b57] hover:bg-[#eef1e6]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div>
                <GrainFill pct={sellThrough(selected)} />
                <div className="mt-2 flex justify-between text-sm text-[#3d4a3a]">
                  <span>{sellThrough(selected)}% sold</span>
                  <span>
                    {selected.quantity_remaining} {selected.unit} left
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4">
                <Detail label="Supplier" value={selected.supplier_name} />
                <Detail
                  label="Consigned on"
                  value={selected.consigned_at}
                />
                <Detail
                  label="Quantity consigned"
                  value={`${selected.quantity_consigned} ${selected.unit}`}
                />
                <Detail
                  label="Quantity sold"
                  value={`${selected.quantity_sold} ${selected.unit}`}
                />
                <Detail
                  label="Quantity remaining"
                  value={`${selected.quantity_remaining} ${selected.unit}`}
                />
                <Detail
                  label="Payment terms"
                  value={
                    selected.payment_term === "cash" ? "Cash" : "Credit"
                  }
                />
              </dl>

              <div>
                <span className="text-xs uppercase tracking-wide text-[#8a9a86]">
                  Status
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_STYLES[selected.status]
                    }`}
                  >
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button className="rounded-full bg-[#f0b84c] px-5 py-2.5 text-sm font-semibold text-[#3a2a06] hover:brightness-95">
                  View orders from this lot
                </button>
                <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#1e4620] ring-1 ring-[#1e4620]/15 hover:bg-[#eef1e6]">
                  Settle with supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[#8a9a86]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-[#1e4620]">{value}</dd>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="flex flex-col items-center gap-2 text-[#8a9a86]">
      <Wheat className="h-6 w-6" />
      <p className="text-sm font-medium text-[#3d4a3a]">No lots match</p>
      <p className="text-xs">Try a different search term or filter.</p>
    </div>
  );
}
