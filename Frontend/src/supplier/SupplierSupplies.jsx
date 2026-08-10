import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Sprout, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { listMySupplies, createSupply, updateSupply, deleteSupply } from "../handlers/supply";
import SupplierAddSupplyModal from "./SupplierAddSupplyModal";

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

// Anything under this is flagged "low" in the table — a UI-only
// threshold, not backed by any schema field, so left as-is.
const LOW_STOCK_THRESHOLD = 50;

export default function SupplierSupplies() {
  const { t, language } = useLanguage();
  const isUr = language === "ur";

  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await listMySupplies();
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError);
      } else {
        setSupplies(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = supplies.filter((s) =>
    (s.item_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAddForm = () => {
    setEditingSupply(null);
    setShowModal(true);
  };

  const openEditForm = (item) => {
    setEditingSupply(item);
    setShowModal(true);
  };

  const handleDelete = async (supplyId) => {
    setActionError(null);
    setDeletingId(supplyId);
    const { error: deleteError } = await deleteSupply(supplyId);
    setDeletingId(null);
    if (deleteError) {
      setActionError(deleteError);
      return;
    }
    setSupplies((prev) => prev.filter((s) => s.supply_id !== supplyId));
  };

  // Passed to the modal as onSubmit. It decides create vs. update based
  // on editingSupply (closed over from this component's own state) —
  // the modal itself has no opinion on which endpoint to call. Throws
  // on failure since the modal's own error handling expects a rejected
  // promise rather than request()'s {data, error} tuple.
  const handleModalSubmit = async (payload) => {
    if (editingSupply) {
      const { data, error: updateError } = await updateSupply(editingSupply.supply_id, payload);
      if (updateError) throw new Error(updateError);
      setSupplies((prev) =>
        prev.map((s) => (s.supply_id === editingSupply.supply_id ? data : s))
      );
    } else {
      const { data, error: createError } = await createSupply(payload);
      if (createError) throw new Error(createError);
      setSupplies((prev) => [data, ...prev]);
    }
  };

  const totalStock = supplies.reduce((sum, s) => sum + s.current_stock, 0);
  const lowStockCount = supplies.filter((s) => s.current_stock < LOW_STOCK_THRESHOLD).length;

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

      {actionError && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-sm"
          style={{ backgroundColor: "#faeaea", color: "#b5544a" }}
        >
          <AlertCircle size={15} />
          {actionError}
        </div>
      )}

      {/* supplies table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "white", borderColor: COLORS.greige }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: COLORS.sub }}>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">{t("supplier.common.loadingSupplies")}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: "#b5544a" }}>
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.sub }}>
                <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.product")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.category")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.quantity")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.supplies.table.price")}</th>
                <th className="text-right font-medium px-5 py-3">{t("supplier.supplies.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.supply_id} className="border-t" style={{ borderColor: COLORS.greige }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#eaf1e4" }}
                      >
                        <Sprout size={14} color={COLORS.leaf} />
                      </div>
                      <span className="font-medium" style={{ color: COLORS.ink }}>
                        {s.item_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {s.category}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      style={{
                        color: s.current_stock < LOW_STOCK_THRESHOLD ? COLORS.goldDark : COLORS.ink,
                        fontWeight: s.current_stock < LOW_STOCK_THRESHOLD ? 500 : 400,
                      }}
                    >
                      {s.current_stock} {s.unit}
                    </span>
                    {s.current_stock < LOW_STOCK_THRESHOLD && (
                      <span className="text-xs ml-1.5" style={{ color: COLORS.goldDark }}>
                        {t("supplier.supplies.low")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {t("supplier.common.currency")} {s.cost_per_unit}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEditForm(s)} aria-label="Edit">
                        <Pencil size={15} color={COLORS.sub} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.supply_id)}
                        disabled={deletingId === s.supply_id}
                        aria-label="Delete"
                      >
                        {deletingId === s.supply_id ? (
                          <Loader2 size={15} className="animate-spin" color="#b5544a" />
                        ) : (
                          <Trash2 size={15} color="#b5544a" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center" style={{ color: COLORS.sub }}>
                    {t("supplier.supplies.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <SupplierAddSupplyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editingSupply={editingSupply}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}