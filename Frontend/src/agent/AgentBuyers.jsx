import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  Wallet,
  ShieldAlert,
  X,
  Phone,
  MapPin,
  IdCard,
} from "lucide-react";

/**
 * AgentBuyers.jsx
 * Agent — register and manage buyers.
 *
 * Buyers have no website accounts in V2; the agent registers them here.
 * Maps to `buyers` (+ aggregated outstanding from `accounts`/`transactions`).
 */

const MOCK_BUYERS = [
  {
    buyer_id: 301,
    name: "Rashid Traders",
    phone: "0300-1234567",
    cnic: "35201-1234567-1",
    address: "Shop 12, Grain Market, Lahore",
    credit_limit: 200000,
    outstanding_balance: 84500,
    active_status: 1,
    created_at: "2026-03-02",
  },
  {
    buyer_id: 302,
    name: "Fatima Provision Store",
    phone: "0321-9988776",
    cnic: "35202-7654321-9",
    address: "Main Bazaar, Faisalabad",
    credit_limit: 100000,
    outstanding_balance: 0,
    active_status: 1,
    created_at: "2026-04-11",
  },
  {
    buyer_id: 303,
    name: "Ali Wholesale Mart",
    phone: "0333-4455667",
    cnic: "35203-2233445-3",
    address: "Vegetable Market, Multan",
    credit_limit: 150000,
    outstanding_balance: 152300,
    active_status: 1,
    created_at: "2026-05-20",
  },
  {
    buyer_id: 304,
    name: "Noor Traders",
    phone: "0345-1122334",
    cnic: "35204-5566778-2",
    address: "Fruit Bazaar, Karachi",
    credit_limit: 50000,
    outstanding_balance: 12000,
    active_status: 0,
    created_at: "2026-01-15",
  },
];

const FILTERS = ["all", "active", "inactive", "over_limit"];
const FILTER_LABEL = {
  all: "All buyers",
  active: "Active",
  inactive: "Inactive",
  over_limit: "Over credit limit",
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
  return {
    name: "",
    phone: "",
    cnic: "",
    address: "",
    credit_limit: "",
  };
}

export default function AgentBuyers() {
  const [buyers, setBuyers] = useState(MOCK_BUYERS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    return buyers.filter((b) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.cnic.includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && b.active_status === 1) ||
        (filter === "inactive" && b.active_status === 0) ||
        (filter === "over_limit" && b.outstanding_balance > b.credit_limit);
      return matchesQuery && matchesFilter;
    });
  }, [buyers, query, filter]);

  const totals = useMemo(() => {
    const active = buyers.filter((b) => b.active_status === 1).length;
    const outstanding = buyers.reduce((s, b) => s + b.outstanding_balance, 0);
    const overLimit = buyers.filter(
      (b) => b.outstanding_balance > b.credit_limit
    ).length;
    return { active, outstanding, overLimit };
  }, [buyers]);

  function submitForm(e) {
    e.preventDefault();
    const newBuyer = {
      buyer_id: Math.max(0, ...buyers.map((b) => b.buyer_id)) + 1,
      name: form.name,
      phone: form.phone,
      cnic: form.cnic,
      address: form.address,
      credit_limit: Number(form.credit_limit) || 0,
      outstanding_balance: 0,
      active_status: 1,
      created_at: new Date().toISOString().slice(0, 10),
    };
    setBuyers((prev) => [newBuyer, ...prev]);
    setForm(emptyForm());
    setFormOpen(false);
  }

  return (
    <div className="min-h-full cw-bg-faf8f3 pb-16">
      <div className="border-b cw-border-1e4620-10 bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest cw-text-2f6b34">
              Agent · Buyers
            </span>
            <h1 className="font-serif text-2xl cw-text-1e4620 sm:text-3xl">
              Buyers
            </h1>
            <p className="mt-1 max-w-xl text-sm cw-text-5c6b57">
              Register buyers who purchase in person, and keep track of
              what each one owes.
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
          >
            <UserPlus className="h-4 w-4" />
            Register buyer
          </button>
        </div>
      </div>

      <div className="px-6 sm:px-8">
        {/* Green spotlight — mirrors the dashboard's "Owed to suppliers" accent card */}
        <div className="mt-6 rounded-2xl cw-bg-1e4620 p-6 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 cw-text-f0b84c" />
            <h3 className="font-serif text-lg">Outstanding to collect</h3>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {totals.outstanding > 0
              ? `${currency(totals.outstanding)} owed across ${
                  buyers.filter((b) => b.outstanding_balance > 0).length
                } buyer(s).`
              : "Every buyer is settled up right now."}
          </p>
          <button className="mt-4 w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95 sm:w-auto">
            Record a payment
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total buyers"
            value={buyers.length}
            sub={`${totals.active} active`}
            tone="green"
          />
          <StatCard
            icon={Wallet}
            label="Total outstanding"
            value={currency(totals.outstanding)}
            sub="Owed to you"
            tone="gold"
          />
          <StatCard
            icon={ShieldAlert}
            label="Over credit limit"
            value={totals.overLimit}
            sub="Needs attention"
            tone="light"
          />
          <StatCard
            icon={Users}
            label="Inactive"
            value={buyers.filter((b) => b.active_status === 0).length}
            sub="Not currently buying"
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
                <th className="px-5 py-3 font-medium">Buyer</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Credit limit</th>
                <th className="px-5 py-3 font-medium">Outstanding</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const overLimit = b.outstanding_balance > b.credit_limit;
                return (
                  <tr
                    key={b.buyer_id}
                    onClick={() => setSelected(b)}
                    className="cursor-pointer border-b cw-border-1e4620-6 last:border-0 cw-hoverbg-faf8f3"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium cw-text-1e4620">
                        {b.name}
                      </div>
                      <div className="text-xs cw-text-8a9a86">
                        #{b.buyer_id} · since {b.created_at}
                      </div>
                    </td>
                    <td className="px-5 py-4 cw-text-3d4a3a">{b.phone}</td>
                    <td className="px-5 py-4 cw-text-3d4a3a">
                      {currency(b.credit_limit)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-medium ${
                          overLimit ? "text-red-600" : "cw-text-3d4a3a"
                        }`}
                      >
                        {currency(b.outstanding_balance)}
                      </span>
                      {overLimit && (
                        <div className="text-xs text-red-500">
                          Over limit
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          b.active_status
                            ? "cw-bg-2f6b34-10 cw-text-2f6b34 cw-ring-2f6b34-25"
                            : "cw-bg-eef1e6 cw-text-8a9a86 cw-ring-1e4620-10"
                        }`}
                      >
                        {b.active_status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-medium cw-text-2f6b34">
                      View
                    </td>
                  </tr>
                );
              })}
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
          {filtered.map((b) => {
            const overLimit = b.outstanding_balance > b.credit_limit;
            return (
              <button
                key={b.buyer_id}
                onClick={() => setSelected(b)}
                className="w-full rounded-2xl bg-white p-4 text-left shadow-sm cw-ring-1e4620-8 active:cw-bg-faf8f3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-serif text-base cw-text-1e4620">
                      {b.name}
                    </div>
                    <div className="text-xs cw-text-8a9a86">{b.phone}</div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      b.active_status
                        ? "cw-bg-2f6b34-10 cw-text-2f6b34"
                        : "cw-bg-eef1e6 cw-text-8a9a86"
                    }`}
                  >
                    {b.active_status ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-xs cw-text-5c6b57">
                  <span>Limit {currency(b.credit_limit)}</span>
                  <span
                    className={
                      overLimit ? "font-medium text-red-600" : "font-medium"
                    }
                  >
                    Owes {currency(b.outstanding_balance)}
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white p-8 shadow-sm cw-ring-1e4620-8">
              <EmptyRow />
            </div>
          )}
        </div>
      </div>

      {/* Buyer detail drawer */}
      {selected && (
        <Drawer onClose={() => setSelected(null)} title={selected.name} eyebrow={`Buyer #${selected.buyer_id}`}>
          <div className="space-y-6 px-6 py-6">
            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={Phone} label="Phone" value={selected.phone} />
              <InfoRow icon={IdCard} label="CNIC" value={selected.cnic} />
              <InfoRow icon={MapPin} label="Address" value={selected.address} />
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-2xl cw-bg-f6f5ee p-4">
              <div>
                <div className="text-xs uppercase tracking-wide cw-text-8a9a86">
                  Credit limit
                </div>
                <div className="mt-1 font-serif text-lg cw-text-1e4620">
                  {currency(selected.credit_limit)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide cw-text-8a9a86">
                  Outstanding
                </div>
                <div
                  className={`mt-1 font-serif text-lg ${
                    selected.outstanding_balance > selected.credit_limit
                      ? "text-red-600"
                      : "cw-text-1e4620"
                  }`}
                >
                  {currency(selected.outstanding_balance)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95">
                Record a payment
              </button>
              <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium cw-text-1e4620 cw-ring-1e4620-15 cw-hoverbg-eef1e6">
                View full ledger
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Register buyer drawer form */}
      {formOpen && (
        <Drawer
          onClose={() => setFormOpen(false)}
          title="Register buyer"
          eyebrow="New buyer"
        >
          <form onSubmit={submitForm} className="space-y-4 px-6 py-6">
            <Field label="Full name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="e.g. Rashid Traders"
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
                placeholder="Shop / market / city"
              />
            </Field>
            <Field label="Credit limit (Rs)">
              <input
                type="number"
                min="0"
                value={form.credit_limit}
                onChange={(e) =>
                  setForm({ ...form, credit_limit: e.target.value })
                }
                className="input"
                placeholder="0"
              />
            </Field>
            <button
              type="submit"
              className="w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
            >
              Save buyer
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
      <Users className="h-6 w-6" />
      <p className="text-sm font-medium cw-text-3d4a3a">No buyers match</p>
      <p className="text-xs">Try a different search term or filter.</p>
    </div>
  );
}
