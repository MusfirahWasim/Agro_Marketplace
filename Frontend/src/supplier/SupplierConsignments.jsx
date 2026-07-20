import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  PackageCheck,
  Users,
  Scale,
  Wallet,
  ChevronDown,
  Inbox,
  Loader2,
} from "lucide-react";

/**
 * SupplierConsignments
 * History of handovers from this supplier to commission agents
 * (i.e. rows from `supplier_agent_consignment` scoped to the logged-in supplier).
 *
 * Matches the Modern Organic & Eco-Friendly theme:
 * - Off-white page background, forest-green accents, gold highlights
 * - Stat cards, searchable/filterable table, status pills
 */

// TODO: replace with real data from GET /suppliers/:id/consignments
const MOCK_CONSIGNMENTS = [
  {
    id: "CSN-1042",
    date: "2026-07-14",
    agent: "Al-Barakah Commission House",
    product: "Basmati Rice",
    grade: "A",
    quantity: 500,
    unit: "kg",
    quantitySold: 500,
    quantityRemaining: 0,
    status: "completed",
  },
  {
    id: "CSN-1041",
    date: "2026-07-12",
    agent: "Zarai Traders",
    product: "Red Onion",
    grade: "B",
    quantity: 1200,
    unit: "kg",
    quantitySold: 640,
    quantityRemaining: 560,
    status: "active",
  },
  {
    id: "CSN-1039",
    date: "2026-07-09",
    agent: "Al-Barakah Commission House",
    product: "Wheat",
    grade: "A",
    quantity: 2000,
    unit: "kg",
    quantitySold: 0,
    quantityRemaining: 2000,
    status: "pending",
  },
  {
    id: "CSN-1035",
    date: "2026-07-03",
    agent: "Green Valley Agents",
    product: "Tomato",
    grade: "A",
    quantity: 300,
    unit: "kg",
    quantitySold: 180,
    quantityRemaining: 120,
    status: "active",
  },
  {
    id: "CSN-1028",
    date: "2026-06-27",
    agent: "Zarai Traders",
    product: "Potato",
    grade: "C",
    quantity: 900,
    unit: "kg",
    quantitySold: 900,
    quantityRemaining: 0,
    status: "completed",
  },
];

const STATUS_STYLES = {
  active: "bg-[#3f8f43]/10 text-[#2f7d32] border-[#3f8f43]/30",
  completed: "bg-[#1e4620]/10 text-[#1e4620] border-[#1e4620]/20",
  pending: "bg-[#f0b84c]/20 text-[#8a5a12] border-[#f0b84c]/40",
};

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  pending: "Awaiting agent",
};

export default function SupplierConsignments() {
  const [loading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const consignments = MOCK_CONSIGNMENTS;

  const filtered = useMemo(() => {
    return consignments.filter((c) => {
      const matchesQuery =
        query.trim() === "" ||
        c.product.toLowerCase().includes(query.toLowerCase()) ||
        c.agent.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [consignments, query, statusFilter]);

  const stats = useMemo(() => {
    const totalConsignments = consignments.length;
    const activeAgents = new Set(consignments.map((c) => c.agent)).size;
    const totalQuantity = consignments.reduce((sum, c) => sum + c.quantity, 0);
    const totalRemaining = consignments.reduce(
      (sum, c) => sum + c.quantityRemaining,
      0
    );
    return { totalConsignments, activeAgents, totalQuantity, totalRemaining };
  }, [consignments]);

  return (
    <div className="min-h-full bg-[#faf9f5] px-6 py-8 sm:px-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#1e4620] mb-1.5">
            Consignments
          </h1>
          <p className="text-gray-500">
            Every handover of your stock to a commission agent, and where it
            stands.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<PackageCheck className="h-5 w-5" />}
          label="Total consignments"
          value={stats.totalConsignments}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Agents working with"
          value={stats.activeAgents}
        />
        <StatCard
          icon={<Scale className="h-5 w-5" />}
          label="Total quantity consigned"
          value={`${stats.totalQuantity.toLocaleString()} kg`}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Still with agents"
          value={`${stats.totalRemaining.toLocaleString()} kg`}
          accent
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus-within:border-[#1e4620] focus-within:ring-2 focus-within:ring-[#1e4620]/10 transition-shadow">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, agent, or consignment ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
          />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="outline-none text-sm text-gray-800 bg-transparent appearance-none cursor-pointer pr-5"
            >
              <option value="all">All statuses</option>
              <option value="pending">Awaiting agent</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 -ml-6 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Loading consignments…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">No consignments match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e4620]/5 text-left text-gray-600">
                  <Th>Consignment</Th>
                  <Th>Date</Th>
                  <Th>Agent</Th>
                  <Th>Product</Th>
                  <Th className="text-right">Consigned</Th>
                  <Th className="text-right">Sold</Th>
                  <Th className="text-right">Remaining</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#faf9f5] transition-colors"
                  >
                    <Td className="font-medium text-[#1e4620]">{c.id}</Td>
                    <Td className="text-gray-500">
                      {new Date(c.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Td>
                    <Td>{c.agent}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span>{c.product}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#f0b84c]/20 text-[#8a5a12]">
                          Grade {c.grade}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-right">
                      {c.quantity.toLocaleString()} {c.unit}
                    </Td>
                    <Td className="text-right">
                      {c.quantitySold.toLocaleString()} {c.unit}
                    </Td>
                    <Td className="text-right font-medium">
                      {c.quantityRemaining.toLocaleString()} {c.unit}
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[c.status]}`}
                      >
                        {STATUS_LABEL[c.status]}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-start gap-4">
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent
            ? "bg-[#f0b84c]/20 text-[#8a5a12]"
            : "bg-[#1e4620]/10 text-[#1e4620]"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-semibold text-[#1e4620]">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-5 py-3.5 font-medium whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-5 py-4 whitespace-nowrap text-gray-700 ${className}`}>
      {children}
    </td>
  );
}