import { useState } from "react";
import {
  X,
  Package,
  Scale,
  Tag,
  Banknote,
  CalendarDays,
  ImagePlus,
  Trash2,
  Sprout,
} from "lucide-react";

/**
 * SupplierAddSupplyModal
 * Matches the Modern Organic & Eco-Friendly theme (LoginPage / SignupPage):
 * - Forest green header strip, gold primary CTA, off-white body, rounded-2xl card
 * - Used to add a new entry to the supplier's `supplies` table (available stock)
 *
 * Props:
 *  - open: boolean — whether the modal is visible
 *  - onClose: () => void — called on cancel / backdrop click / X button
 *  - onSubmit: (supply) => Promise<void> | void — called with the new supply payload
 */

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains & Cereals",
  "Pulses",
  "Spices",
  "Dairy",
  "Other",
];

const UNITS = ["kg", "quintal", "ton", "crate", "bag", "dozen"];

const GRADES = [
  { key: "A", label: "Grade A — Premium" },
  { key: "B", label: "Grade B — Standard" },
  { key: "C", label: "Grade C — Economy" },
];

const initialForm = {
  productName: "",
  category: CATEGORIES[0],
  quantity: "",
  unit: UNITS[0],
  pricePerUnit: "",
  grade: "A",
  harvestDate: "",
  notes: "",
};

export default function SupplierAddSupplyModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function resetAndClose() {
    setForm(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setError("");
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.productName || !form.quantity || !form.pricePerUnit) {
      setError("Please fill in product name, quantity, and price per unit.");
      return;
    }
    if (Number(form.quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if (Number(form.pricePerUnit) <= 0) {
      setError("Price per unit must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit),
        image: imageFile,
      });
      resetAndClose();
    } catch (err) {
      setError(err?.message || "Couldn't add supply. Please try again.");
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
    >
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
              <h2 id="add-supply-title" className="font-serif text-xl leading-tight">
                Add new supply
              </h2>
              <p className="text-white/70 text-xs">
                Adds stock to your available inventory
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
          {/* Image upload */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">
              Product photo
            </label>
            {imagePreview ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Supply preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:bg-white shadow"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 w-full h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1e4620] cursor-pointer text-gray-400 hover:text-[#1e4620] transition-colors">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Click to upload a photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Product name */}
          <Field label="Product name" required>
            <IconInput
              icon={<Package className="h-4 w-4" />}
              type="text"
              placeholder="e.g. Basmati Rice"
              value={form.productName}
              onChange={(v) => updateField("productName", v)}
            />
          </Field>

          {/* Category + Grade */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <SelectInput
                icon={<Tag className="h-4 w-4" />}
                value={form.category}
                onChange={(v) => updateField("category", v)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            <Field label="Quality grade">
              <SelectInput
                icon={<Sprout className="h-4 w-4" />}
                value={form.grade}
                onChange={(v) => updateField("grade", v)}
                options={GRADES.map((g) => ({ value: g.key, label: g.label }))}
              />
            </Field>
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity" required>
              <IconInput
                icon={<Scale className="h-4 w-4" />}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.quantity}
                onChange={(v) => updateField("quantity", v)}
              />
            </Field>
            <Field label="Unit">
              <SelectInput
                value={form.unit}
                onChange={(v) => updateField("unit", v)}
                options={UNITS.map((u) => ({ value: u, label: u }))}
              />
            </Field>
          </div>

          {/* Price per unit + Harvest date */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price per unit (PKR)" required>
              <IconInput
                icon={<Banknote className="h-4 w-4" />}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.pricePerUnit}
                onChange={(v) => updateField("pricePerUnit", v)}
              />
            </Field>
            <Field label="Harvest date">
              <IconInput
                icon={<CalendarDays className="h-4 w-4" />}
                type="date"
                value={form.harvestDate}
                onChange={(v) => updateField("harvestDate", v)}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes (optional)">
            <textarea
              rows={3}
              placeholder="Storage conditions, batch details, or anything an agent should know…"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#f0b84c] hover:bg-[#e8ab30] disabled:opacity-60 disabled:cursor-not-allowed text-[#1e4620] transition-colors"
          >
            {submitting ? "Adding…" : "Add supply"}
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