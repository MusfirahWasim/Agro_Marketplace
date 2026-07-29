import { useState } from "react";
import { Plus, Search, Pencil, Trash2, X, Sprout } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  goldDark: "#d99e2f",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
  border: "#d9ddce",
};

const INITIAL_SUPPLIES = [
  { id: 1, product: "Tomato (Grade A)", productKey: "tomatoGradeA", category: "Vegetable", categoryKey: "vegetable", qty: 320, unit: "kg", price: 85, added: "2026-07-10" },
  { id: 2, product: "Onion", productKey: "onion", category: "Vegetable", categoryKey: "vegetable", qty: 540, unit: "kg", price: 60, added: "2026-07-09" },
  { id: 3, product: "Potato", productKey: "potato", category: "Vegetable", categoryKey: "vegetable", qty: 780, unit: "kg", price: 45, added: "2026-07-08" },
  { id: 4, product: "Green chili", productKey: "greenChili", category: "Vegetable", categoryKey: "vegetable", qty: 15, unit: "kg", price: 140, added: "2026-07-07" },
  { id: 5, product: "Spinach", productKey: "spinach", category: "Leafy green", categoryKey: "leafyGreen", qty: 22, unit: "kg", price: 55, added: "2026-07-06" },
];

const emptyForm = { product: "", category: "", qty: "", unit: "kg", price: "" };

export default function SupplierSupplies() {
  const { t, formatDate, language } = useLanguage();
  const isUr = language === "ur";
  const unit = isUr ? "کلوگرام" : "kg";
  const [supplies, setSupplies] = useState(INITIAL_SUPPLIES);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = supplies.filter((s) => {
    const displayName = s.productKey ? t(`common.produce.${s.productKey}`) : s.product;
    return (
      s.product.toLowerCase().includes(search.toLowerCase()) ||
      displayName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      product: item.productKey ? t(`common.produce.${item.productKey}`) : item.product,
      category: item.categoryKey ? t(`common.categories.${item.categoryKey}`) : item.category,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setSupplies((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      // Edits from the form are free-text, so they no longer map to a
      // known productKey/categoryKey — clear those so the raw text is shown.
      setSupplies((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                ...form,
                productKey: undefined,
                categoryKey: undefined,
                qty: Number(form.qty),
                price: Number(form.price),
              }
            : s
        )
      );
    } else {
      setSupplies((prev) => [
        {
          id: Date.now(),
          ...form,
          qty: Number(form.qty),
          price: Number(form.price),
          added: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const totalStock = supplies.reduce((sum, s) => sum + s.qty, 0);
  const lowStockCount = supplies.filter((s) => s.qty < 50).length;

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
        .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
      `}</style>

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
            {t("supplier.supplies.title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            {t("supplier.supplies.productsCount", { count: supplies.length })} &middot;{" "}
            {t("supplier.supplies.totalStock", { amount: totalStock.toLocaleString() })}
            {lowStockCount > 0 && (
              <span style={{ color: COLORS.goldDark }}>
                {" "}
                &middot; {t("supplier.supplies.runningLow", { count: lowStockCount })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium self-start"
          style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
        >
          <Plus size={16} />
          {t("supplier.supplies.addSupply")}
        </button>
      </div>

      {/* search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#909685" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("supplier.supplies.searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none"
          style={{ borderColor: COLORS.border, backgroundColor: "white" }}
        />
      </div>

      {/* add / edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border p-5 mb-6"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
              {editingId ? t("supplier.supplies.editSupply") : t("supplier.supplies.addNewSupply")}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X size={18} color={COLORS.sub} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                {t("supplier.supplies.form.productName")}
              </label>
              <input
                required
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                placeholder={t("supplier.supplies.form.productPlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: COLORS.border }}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                {t("supplier.supplies.form.category")}
              </label>
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder={t("supplier.supplies.form.categoryPlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: COLORS.border }}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                {t("supplier.supplies.form.quantity")}
              </label>
              <input
                required
                type="number"
                min="0"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: COLORS.border }}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                {t("supplier.supplies.form.price")}
              </label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: COLORS.border }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.forest, color: "white" }}
            >
              {editingId ? t("supplier.supplies.saveChanges") : t("supplier.supplies.addToInventory")}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: COLORS.border, color: COLORS.sub }}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {/* supplies table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "white", borderColor: COLORS.greige }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: COLORS.sub }}>
              <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.product")}</th>
              <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.category")}</th>
              <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.quantity")}</th>
              <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.price")}</th>
              <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.added")}</th>
              <th className="text-right font-medium px-5 py-3">{t("supplier.supplies.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t" style={{ borderColor: COLORS.greige }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#eaf1e4" }}
                    >
                      <Sprout size={14} color={COLORS.leaf} />
                    </div>
                    <span className="font-medium" style={{ color: COLORS.ink }}>
                      {s.productKey ? t(`common.produce.${s.productKey}`) : s.product}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {s.categoryKey ? t(`common.categories.${s.categoryKey}`) : s.category}
                </td>
                <td className="px-5 py-3">
                  <span
                    style={{
                      color: s.qty < 50 ? COLORS.goldDark : COLORS.ink,
                      fontWeight: s.qty < 50 ? 500 : 400,
                    }}
                  >
                    {s.qty} {unit}
                  </span>
                  {s.qty < 50 && (
                    <span className="text-xs ml-1.5" style={{ color: COLORS.goldDark }}>
                      {t("supplier.supplies.low")}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                  {t("supplier.common.currency")} {s.price}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {formatDate(s.added)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openEditForm(s)} aria-label="Edit">
                      <Pencil size={15} color={COLORS.sub} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} aria-label="Delete">
                      <Trash2 size={15} color="#b5544a" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center" style={{ color: COLORS.sub }}>
                  {t("supplier.supplies.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
