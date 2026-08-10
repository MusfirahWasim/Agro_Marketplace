import { useEffect, useState } from "react";
import { X, Package, Scale, Tag, Banknote, Sprout } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * SupplierAddSupplyModal
 * Matches the Modern Organic & Eco-Friendly theme (LoginPage / SignupPage):
 * - Forest green header strip, gold primary CTA, off-white body, rounded-2xl card
 * - Used to add OR edit an entry in the supplier's `supplies` table
 * Fully localized (English / Urdu) via LanguageContext.
 *
 * Props:
 *  - open: boolean — whether the modal is visible
 *  - onClose: () => void — called on cancel / backdrop click / X button
 *  - editingSupply: SupplyRead | null — pass a supply object to pre-fill
 *    the form in edit mode (title/button switch to "Save changes"); pass
 *    null/omit for add mode. This modal doesn't call the update/create
 *    endpoint itself — the parent's onSubmit decides which based on
 *    whatever it's tracking (e.g. its own editingId state), since the
 *    payload shape is identical for both.
 *  - onSubmit: (payload) => Promise<void> | void — called with a payload
 *    shaped EXACTLY like SupplyCreate/SupplyUpdate: { item_name, category,
 *    unit, current_stock, cost_per_unit, description }. This modal builds
 *    that shape directly so the parent can pass it straight to
 *    createSupply()/updateSupply() with no remapping.
 *    NOTE: this component's error handling assumes onSubmit throws/rejects
 *    on failure. If the parent calls createSupply()/updateSupply() (which
 *    return {data, error} rather than throwing per request()'s
 *    convention), the parent's onSubmit must check `error` and throw
 *    itself, or a failed save will look like a success here.
 */

// NOTE: values here are UI translation keys for the label only. The
// values actually sent to the backend are canonical English strings
// (see CATEGORY_VALUES) since `category` is a free-text column, not an
// enum, and BuyerMarketplace's filter pills are built from whatever
// distinct strings suppliers actually save — inconsistent casing/keys
// across supplier-facing forms would fragment that filter. Flagging
// this mapping as an assumption: if another supplier screen also
// writes `category`, it needs to agree on the same canonical strings.
const CATEGORY_KEYS = [
  "vegetables",
  "fruits",
  "grainsCereals",
  "pulses",
  "spices",
  "dairy",
  "other",
];

const CATEGORY_VALUES = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  grainsCereals: "Grains & Cereals",
  pulses: "Pulses",
  spices: "Spices",
  dairy: "Dairy",
  other: "Other",
};

// Matches UnitType exactly: kg | bag | crate | dozen | ton | maund.
// The old list had "quintal" (not a real unit — would 422 on submit)
// and was missing "maund" entirely.
// NOTE: "supplier.addSupplyModal.units.maund" is a new translation key
// this needs — translations.js is out of scope for me to edit here.
const UNIT_KEYS = ["kg", "bag", "crate", "dozen", "ton", "maund"];

const initialForm = {
  item_name: "",
  category: CATEGORY_KEYS[0],
  current_stock: "",
  unit: UNIT_KEYS[0],
  cost_per_unit: "",
  description: "",
};

export default function SupplierAddSupplyModal({ open, onClose, onSubmit, editingSupply = null }) {
  const { t, language } = useLanguage();
  const isUr = language === "ur";
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (editingSupply) {
      // Reverse-map the stored canonical category string back to a UI
      // key. If it doesn't match any known value (e.g. data written by
      // something other than this modal), fall back to the first option
      // rather than silently losing the original value on save.
      const matchedKey =
        CATEGORY_KEYS.find((k) => CATEGORY_VALUES[k] === editingSupply.category) ??
        CATEGORY_KEYS[0];
      setForm({
        item_name: editingSupply.item_name ?? "",
        category: matchedKey,
        current_stock: String(editingSupply.current_stock ?? ""),
        unit: editingSupply.unit ?? UNIT_KEYS[0],
        cost_per_unit: String(editingSupply.cost_per_unit ?? ""),
        description: editingSupply.description ?? "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, editingSupply]);

  if (!open) return null;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetAndClose() {
    setForm(initialForm);
    setError("");
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.item_name || !form.current_stock || !form.cost_per_unit) {
      setError(t("supplier.addSupplyModal.errors.required"));
      return;
    }
    if (!Number.isInteger(Number(form.current_stock)) || Number(form.current_stock) < 0) {
      setError(t("supplier.addSupplyModal.errors.quantity"));
      return;
    }
    if (Number(form.cost_per_unit) <= 0) {
      setError(t("supplier.addSupplyModal.errors.price"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        item_name: form.item_name,
        category: CATEGORY_VALUES[form.category],
        unit: form.unit,
        current_stock: parseInt(form.current_stock, 10),
        cost_per_unit: Number(form.cost_per_unit),
        description: form.description || undefined,
      });
      resetAndClose();
    } catch (err) {
      setError(err?.message || t("supplier.addSupplyModal.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-supply-title"
      dir={isUr ? "rtl" : "ltr"}
      style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : undefined }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1e4620]/40 backdrop-blur-[2px]"
        onClick={submitting ? undefined : resetAndClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-[#faf9f5] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-[#1e4620] text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#f0b84c] flex items-center justify-center text-[#1e4620]">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h2 id="add-supply-title" className={`text-xl leading-tight ${isUr ? "" : "font-display"}`}>
                {editingSupply ? t("supplier.supplies.editSupply") : t("supplier.addSupplyModal.title")}
              </h2>
              <p className="text-white/70 text-xs">
                {t("supplier.addSupplyModal.subtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            disabled={submitting}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 space-y-5 overflow-y-auto"
        >
          {/* Product name */}
          <Field label={t("supplier.addSupplyModal.productName")} required>
            <IconInput
              icon={<Package className="h-4 w-4" />}
              type="text"
              maxLength={50}
              placeholder={t("supplier.addSupplyModal.productNamePlaceholder")}
              value={form.item_name}
              onChange={(v) => updateField("item_name", v)}
            />
          </Field>

          {/* Category */}
          <Field label={t("supplier.addSupplyModal.category")}>
            <SelectInput
              icon={<Tag className="h-4 w-4" />}
              value={form.category}
              onChange={(v) => updateField("category", v)}
              options={CATEGORY_KEYS.map((k) => ({
                value: k,
                label: t(`common.categories.${k}`),
              }))}
            />
          </Field>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("supplier.addSupplyModal.quantity")} required>
              <IconInput
                icon={<Scale className="h-4 w-4" />}
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.current_stock}
                onChange={(v) => updateField("current_stock", v)}
              />
            </Field>
            <Field label={t("supplier.addSupplyModal.unit")}>
              <SelectInput
                value={form.unit}
                onChange={(v) => updateField("unit", v)}
                options={UNIT_KEYS.map((u) => ({
                  value: u,
                  label: t(`supplier.addSupplyModal.units.${u}`),
                }))}
              />
            </Field>
          </div>

          {/* Price per unit */}
          <Field label={t("supplier.addSupplyModal.pricePerUnit")} required>
            <IconInput
              icon={<Banknote className="h-4 w-4" />}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.cost_per_unit}
              onChange={(v) => updateField("cost_per_unit", v)}
            />
          </Field>

          {/* Description */}
          <Field label={t("supplier.addSupplyModal.notes")}>
            <textarea
              rows={3}
              maxLength={200}
              placeholder={t("supplier.addSupplyModal.notesPlaceholder")}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1e4620] focus:ring-2 focus:ring-[#1e4620]/10 transition-shadow resize-none"
            />
          </Field>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-60 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#f0b84c] hover:bg-[#e8ab30] disabled:opacity-60 disabled:cursor-not-allowed text-[#1e4620] transition-colors"
          >
            {submitting
              ? t("supplier.addSupplyModal.adding")
              : editingSupply
              ? t("supplier.supplies.saveChanges")
              : t("supplier.addSupplyModal.addSupply")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">
        {label} {required && <span className="text-[#f0b84c]">*</span>}
      </label>
      {children}
    </div>
  );
}

function IconInput({ icon, value, onChange, ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3 focus-within:border-[#1e4620] focus-within:ring-2 focus-within:ring-[#1e4620]/10 transition-shadow">
      {icon && <span className="text-gray-400">{icon}</span>}
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
      />
    </div>
  );
}

function SelectInput({ icon, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3 focus-within:border-[#1e4620] focus-within:ring-2 focus-within:ring-[#1e4620]/10 transition-shadow">
      {icon && <span className="text-gray-400">{icon}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 outline-none text-sm text-gray-800 bg-transparent appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}