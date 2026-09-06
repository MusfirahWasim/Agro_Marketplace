import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
  Boxes,
  Layers,
  Package,
  X,
} from "lucide-react";

/**
 * AgentProducts.jsx
 * Agent — manage the product catalog.
 *
 * Maps to `products` (name, category, unit, description, active_status).
 * This is the reference catalog that `supplier_supplies` and
 * `sale_items` point to — it doesn't carry stock/price itself.
 */

const CATEGORIES = ["Grain", "Vegetable", "Fruit", "Pulses", "Other"];
const UNITS = ["kg", "bag", "crate", "dozen", "ton", "maund"];

const MOCK_PRODUCTS = [
  {
    product_id: 1,
    name: "Basmati Rice",
    category: "Grain",
    unit: "bag",
    description: "Premium long-grain basmati",
    active_status: 1,
    linked_lots: 3,
  },
  {
    product_id: 2,
    name: "Red Onion",
    category: "Vegetable",
    unit: "crate",
    description: "Standard grade red onion",
    active_status: 1,
    linked_lots: 2,
  },
  {
    product_id: 3,
    name: "Wheat",
    category: "Grain",
    unit: "ton",
    description: "Milling-grade wheat",
    active_status: 1,
    linked_lots: 1,
  },
  {
    product_id: 4,
    name: "Tomato",
    category: "Vegetable",
    unit: "crate",
    description: "Fresh market tomato",
    active_status: 1,
    linked_lots: 1,
  },
  {
    product_id: 5,
    name: "Green Chili",
    category: "Vegetable",
    unit: "crate",
    description: "",
    active_status: 0,
    linked_lots: 0,
  },
  {
    product_id: 6,
    name: "Chickpea",
    category: "Pulses",
    unit: "bag",
    description: "Desi chickpea, sun-dried",
    active_status: 1,
    linked_lots: 0,
  },
];

const FILTERS = ["all", ...CATEGORIES];

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
  return { name: "", category: CATEGORIES[0], unit: UNITS[0], description: "" };
}

export default function AgentProducts() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || p.category === filter;
      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);

  const totals = useMemo(() => {
    const active = products.filter((p) => p.active_status === 1).length;
    const categories = new Set(products.map((p) => p.category)).size;
    const inUse = products.filter((p) => p.linked_lots > 0).length;
    return { active, categories, inUse };
  }, [products]);

  function submitForm(e) {
    e.preventDefault();
    const newProduct = {
      product_id: Math.max(0, ...products.map((p) => p.product_id)) + 1,
      name: form.name,
      category: form.category,
      unit: form.unit,
      description: form.description,
      active_status: 1,
      linked_lots: 0,
    };
    setProducts((prev) => [newProduct, ...prev]);
    setForm(emptyForm());
    setFormOpen(false);
  }

  function toggleActive(id) {
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === id ? { ...p, active_status: p.active_status ? 0 : 1 } : p
      )
    );
  }

  return (
    <div className="min-h-full cw-bg-faf8f3 pb-16">
      <div className="border-b cw-border-1e4620-10 bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest cw-text-2f6b34">
              Agent · Products
            </span>
            <h1 className="font-serif text-2xl cw-text-1e4620 sm:text-3xl">
              Product catalog
            </h1>
            <p className="mt-1 max-w-xl text-sm cw-text-5c6b57">
              The reference list of products suppliers can bring and
              buyers can purchase — supply lots and sales are built on
              top of these entries.
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
          >
            <PlusCircle className="h-4 w-4" />
            Add product
          </button>
        </div>
      </div>

      <div className="px-6 sm:px-8">
        {/* Green spotlight — mirrors the dashboard's accent card style */}
        <div className="mt-6 rounded-2xl cw-bg-1e4620 p-6 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 cw-text-f0b84c" />
            <h3 className="font-serif text-lg">Products without stock</h3>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {products.filter((p) => p.linked_lots === 0).length > 0
              ? `${
                  products.filter((p) => p.linked_lots === 0).length
                } product(s) have no open consignment lots yet.`
              : "Every active product currently has stock."}
          </p>
          <button className="mt-4 w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95 sm:w-auto">
            Go to consignment intake
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Boxes}
            label="Total products"
            value={products.length}
            sub={`${totals.active} active`}
            tone="green"
          />
          <StatCard
            icon={Layers}
            label="Categories"
            value={totals.categories}
            tone="gold"
          />
          <StatCard
            icon={Package}
            label="Currently in stock"
            value={totals.inUse}
            sub="Have open lots"
            tone="light"
          />
          <StatCard
            icon={Boxes}
            label="Inactive"
            value={products.filter((p) => p.active_status === 0).length}
            tone="light"
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cw-text-8a9a86" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product name"
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
                {f === "all" ? "All categories" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of product cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.product_id}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-sm cw-ring-1e4620-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-full cw-bg-eef1e6 px-2.5 py-0.5 text-xs font-medium cw-text-2f6b34">
                    {p.category}
                  </span>
                  <h3 className="mt-2 font-serif text-lg cw-text-1e4620">
                    {p.name}
                  </h3>
                </div>
                <button
                  onClick={() => toggleActive(p.product_id)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.active_status
                      ? "cw-bg-2f6b34-10 cw-text-2f6b34 cw-ring-2f6b34-25"
                      : "cw-bg-eef1e6 cw-text-8a9a86 cw-ring-1e4620-10"
                  }`}
                >
                  {p.active_status ? "Active" : "Inactive"}
                </button>
              </div>
              <p className="mt-2 min-h-[2.5rem] text-sm cw-text-5c6b57">
                {p.description || "No description added."}
              </p>
              <div className="mt-4 flex items-center justify-between border-t cw-border-1e4620-8 pt-3 text-xs cw-text-8a9a86">
                <span>Sold by {p.unit}</span>
                <span>
                  {p.linked_lots > 0
                    ? `${p.linked_lots} open lot${p.linked_lots > 1 ? "s" : ""}`
                    : "No stock yet"}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white p-10 text-center shadow-sm cw-ring-1e4620-8">
              <Boxes className="mx-auto h-6 w-6 cw-text-8a9a86" />
              <p className="mt-2 text-sm font-medium cw-text-3d4a3a">
                No products match
              </p>
              <p className="text-xs cw-text-8a9a86">
                Try a different search term or category.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add product drawer */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end cw-bg-1e4620-30 backdrop-blur-[2px]">
          <div className="h-full w-full max-w-md overflow-y-auto cw-bg-faf8f3 shadow-2xl">
            <div className="flex items-center justify-between border-b cw-border-1e4620-10 bg-white px-6 py-5">
              <div>
                <span className="text-xs uppercase tracking-widest cw-text-2f6b34">
                  New product
                </span>
                <h2 className="font-serif text-xl cw-text-1e4620">
                  Add to catalog
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
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  Product name
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Sugarcane"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  Category
                </span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  Default unit
                </span>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="input"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide cw-text-5c6b57">
                  Description (optional)
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input min-h-[80px] resize-none"
                  placeholder="Grade, notes, variety..."
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full cw-bg-f0b84c px-5 py-2.5 text-sm font-semibold cw-text-3a2a06 hover:brightness-95"
              >
                Save product
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
