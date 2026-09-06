import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Sprout,
  Wallet,
  Package,
  X,
  Phone,
  MapPin,
  IdCard,
} from "lucide-react";

/**
 * AgentSuppliers.jsx
 * Agent — register and manage suppliers.
 *
 * Suppliers have no website accounts in V2; the agent registers them here.
 * Maps to `suppliers` (+ aggregated payable from `accounts`/`transactions`,
 * open lots from `consignments`).
 */

const MOCK_SUPPLIERS = [
  {
    supplier_id: 201,
    name: "Iqbal Farms",
    phone: "0301-2233445",
    cnic: "36101-1122334-5",
    address: "Chak 45, Sahiwal",
    open_consignments: 2,
    payable_balance: 118000,
    active_status: 1,
    created_at: "2026-02-10",
  },
  {
    supplier_id: 202,
    name: "Nazir Produce Co.",
    phone: "0312-9988112",
    cnic: "36102-4433221-8",
    address: "Mandi Road, Okara",
    open_consignments: 1,
    payable_balance: 0,
    active_status: 1,
    created_at: "2026-03-18",
  },
  {
    supplier_id: 203,
    name: "Chishti Estates",
    phone: "0333-5566778",
    cnic: "36103-7788990-1",
    address: "Village Bhaipheru, Kasur",
    open_consignments: 1,
    payable_balance: 46200,
    active_status: 1,
    created_at: "2026-04-02",
  },
  {
    supplier_id: 204,
    name: "Green Valley Growers",
    phone: "0345-2211334",
    cnic: "36104-9988776-2",
    address: "Raiwind Road, Lahore",
    open_consignments: 0,
    payable_balance: 0,
    active_status: 0,
    created_at: "2026-01-25",
  },
];

const FILTERS = ["all", "active", "inactive", "has_payable"];
const FILTER_LABEL = {
  all: "All suppliers",
  active: "Active",
  inactive: "Inactive",
  has_payable: "Payment due",
};

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
  return { name: "", phone: "", cnic: "", address: "" };
}

export default function AgentSuppliers() {
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.cnic.includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && s.active_status === 1) ||
        (filter === "inactive" && s.active_status === 0) ||
        (filter === "has_payable" && s.payable_balance > 0);
      return matchesQuery && matchesFilter;
    });
  }, [suppliers, query, filter]);

  const totals = useMemo(() => {
    const active = suppliers.filter((s) => s.active_status === 1).length;
    const payable = suppliers.reduce((s, x) => s + x.payable_balance, 0);
    const openLots = suppliers.reduce((s, x) => s + x.open_consignments, 0);
    return { active, payable, openLots };
  }, [suppliers]);

  function submitForm(e) {
    e.preventDefault();
    const newSupplier = {
      supplier_id: Math.max(0, ...suppliers.map((s) => s.supplier_id)) + 1,
      name: form.name,
      phone: form.phone,
      cnic: form.cnic,
      address: form.address,
      open_consignments: 0,
      payable_balance: 0,
      active_status: 1,
      created_at: new Date().toISOString().slice(0, 10),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    setForm(emptyForm());
    setFormOpen(false);
  }

  return (
    <div className="min-h-full cw-bg-faf8f3 pb-16">
      <div className="border-b cw-border-1e4620-10 bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest cw-text-2f6b34">
              Agent · Suppliers
            </span>
            <h1 className="font-serif text-2xl cw-text-1e4620 sm:text-3xl">
              Suppliers
            </h1>
            <p className="mt-1 max-w-xl text-sm cw-text-5c6b57">
              Register suppliers who bring stock to you, and track what
              you still owe each one.
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
          >
            <UserPlus className="h-4 w-4" />
            Register supplier
          </button>
        </div>
      </div>

      <div className="px-6 sm:px-8">
        {/* Green spotlight — same card as the dashboard's "Owed to suppliers" */}
        <div className="mt-6 rounded-2xl cw-bg-1e4620 p-6 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 cw-text-f0b84c" />
            <h3 className="font-serif text-lg">Owed to suppliers</h3>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {totals.payable > 0
              ? `${currency(totals.payable)} outstanding across ${
                  suppliers.filter((s) => s.payable_balance > 0).length
                } supplier(s).`
              : "Nothing outstanding right now."}
          </p>
          <button className="mt-4 w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95 sm:w-auto">
            Settle now
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Sprout}
            label="Total suppliers"
            value={suppliers.length}
            sub={`${totals.active} active`}
            tone="green"
          />
          <StatCard
            icon={Wallet}
            label="Payable balance"
            value={currency(totals.payable)}
            sub="You owe them"
            tone="gold"
          />
          <StatCard
            icon={Package}
            label="Open consignments"
            value={totals.openLots}
            sub="Currently in your stock"
            tone="light"
          />
          <StatCard
            icon={Sprout}
            label="Inactive"
            value={suppliers.filter((s) => s.active_status === 0).length}
            sub="Not currently supplying"
            tone="light"
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cw-text-8a9a86" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, or CNIC"
              className="w-full rounded-full border cw-border-1e4620-15 bg-white py-2.5 pl-9 pr-4 text-sm cw-text-1e4620 cw-placeholdertext-a3ac9e foc-border focus:outline-none foc-ring"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
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
                <th className="px-5 py-3 font-medium">Supplier</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Open lots</th>
                <th className="px-5 py-3 font-medium">Payable</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.supplier_id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer border-b cw-border-1e4620-6 last:border-0 cw-hoverbg-faf8f3"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium cw-text-1e4620">
                      {s.name}
                    </div>
                    <div className="text-xs cw-text-8a9a86">
                      #{s.supplier_id} · since {s.created_at}
                    </div>
                  </td>
                  <td className="px-5 py-4 cw-text-3d4a3a">{s.phone}</td>
                  <td className="px-5 py-4 cw-text-3d4a3a">
                    {s.open_consignments}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`font-medium ${
                        s.payable_balance > 0
                          ? "cw-text-8a5a10"
                          : "cw-text-3d4a3a"
                      }`}
                    >
                      {currency(s.payable_balance)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.active_status
                          ? "cw-bg-2f6b34-10 cw-text-2f6b34 cw-ring-2f6b34-25"
                          : "cw-bg-eef1e6 cw-text-8a9a86 cw-ring-1e4620-10"
                      }`}
                    >
                      {s.active_status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-xs font-medium cw-text-2f6b34">
                    View
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <EmptyRow />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="mt-6 space-y-3 lg:hidden">
          {filtered.map((s) => (
            <button
              key={s.supplier_id}
              onClick={() => setSelected(s)}
              className="w-full rounded-2xl bg-white p-4 text-left shadow-sm cw-ring-1e4620-8 active:cw-bg-faf8f3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-base cw-text-1e4620">
                    {s.name}
                  </div>
                  <div className="text-xs cw-text-8a9a86">{s.phone}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    s.active_status
                      ? "cw-bg-2f6b34-10 cw-text-2f6b34"
                      : "cw-bg-eef1e6 cw-text-8a9a86"
                  }`}
                >
                  {s.active_status ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-3 flex justify-between text-xs cw-text-5c6b57">
                <span>{s.open_consignments} open lots</span>
                <span className="font-medium">
                  Payable {currency(s.payable_balance)}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm cw-ring-1e4620-8">
              <EmptyRow />
            </div>
          )}
        </div>
      </div>

      {/* Supplier detail drawer */}
      {selected && (
        <Drawer
          onClose={() => setSelected(null)}
          title={selected.name}
          eyebrow={`Supplier #${selected.supplier_id}`}
        >
          <div className="space-y-6 px-6 py-6">
            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={Phone} label="Phone" value={selected.phone} />
              <InfoRow icon={IdCard} label="CNIC" value={selected.cnic} />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={selected.address}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-2xl cw-bg-f6f5ee p-4">
              <div>
                <div className="text-xs uppercase tracking-wide cw-text-8a9a86">
                  Open lots
                </div>
                <div className="mt-1 font-serif text-lg cw-text-1e4620">
                  {selected.open_consignments}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide cw-text-8a9a86">
                  Payable
                </div>
                <div className="mt-1 font-serif text-lg cw-text-8a5a10">
                  {currency(selected.payable_balance)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95">
                Settle payment
              </button>
              <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium cw-text-1e4620 cw-ring-1e4620-15 cw-hoverbg-eef1e6">
                View full ledger
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Register supplier drawer form */}
      {formOpen && (
        <Drawer
          onClose={() => setFormOpen(false)}
          title="Register supplier"
          eyebrow="New supplier"
        >
          <form onSubmit={submitForm} className="space-y-4 px-6 py-6">
            <Field label="Full name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="e.g. Iqbal Farms"
              />
            </Field>
            <Field label="Phone">
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
                placeholder="03XX-XXXXXXX"
              />
            </Field>
            <Field label="CNIC">
              <input
                value={form.cnic}
                onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                className="input"
                placeholder="XXXXX-XXXXXXX-X"
              />
            </Field>
            <Field label="Address">
              <input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                className="input"
                placeholder="Village / mandi / city"
              />
            </Field>
            <button
              type="submit"
              className="w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
            >
              Save supplier
            </button>
          </form>
        </Drawer>
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

function Drawer({ onClose, title, eyebrow, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end cw-bg-1e4620-30 backdrop-blur-[2px]">
      <div className="h-full w-full max-w-md overflow-y-auto cw-bg-faf8f3 shadow-2xl">
        <div className="flex items-center justify-between border-b cw-border-1e4620-10 bg-white px-6 py-5">
          <div>
            <span className="text-xs uppercase tracking-widest cw-text-2f6b34">
              {eyebrow}
            </span>
            <h2 className="font-serif text-xl cw-text-1e4620">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 cw-text-5c6b57 cw-hoverbg-eef1e6"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl cw-bg-f6f5ee px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 cw-text-2f6b34" />
      <div>
        <div className="text-xs cw-text-8a9a86">{label}</div>
        <div className="text-sm font-medium cw-text-1e4620">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="flex flex-col items-center gap-2 cw-text-8a9a86">
      <Sprout className="h-6 w-6" />
      <p className="text-sm font-medium cw-text-3d4a3a">
        No suppliers match
      </p>
      <p className="text-xs">Try a different search term or filter.</p>
    </div>
  );
}
