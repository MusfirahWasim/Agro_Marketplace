import { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  Wallet,
  Clock,
  TrendingUp,
  Banknote,
  Inbox,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
} from "lucide-react";

/**
 * SupplierPayments
 * Settlements received from commission agents + running ledger for this supplier.
 * (Rows from `payments` where party = supplier, cross-referenced with `accounts`
 * for running balance.)
 *
 * Matches the Modern Organic & Eco-Friendly theme:
 * - Off-white page background, forest-green accents, gold highlights
 * - Stat cards, searchable/filterable table, debit/credit ledger styling
 */

// TODO: replace with real data from GET /suppliers/:id/payments
const MOCK_PAYMENTS = [
  {
    id: "PMT-3391",
    date: "2026-07-15",
    agent: "Al-Barakah Commission House",
    consignmentId: "CSN-1042",
    type: "settlement",
    method: "bank_transfer",
    amount: 84500,
    status: "completed",
    runningBalance: 214300,
  },
  {
    id: "PMT-3388",
    date: "2026-07-12",
    agent: "Zarai Traders",
    consignmentId: "CSN-1041",
    type: "settlement",
    method: "cash",
    amount: 38200,
    status: "completed",
    runningBalance: 129800,
  },
  {
    id: "PMT-3379",
    date: "2026-07-06",
    agent: "Green Valley Agents",
    consignmentId: "CSN-1035",
    type: "partial_settlement",
    method: "bank_transfer",
    amount: 15000,
    status: "completed",
    runningBalance: 91600,
  },
  {
    id: "PMT-3364",
    date: "2026-06-29",
    agent: "Zarai Traders",
    consignmentId: "CSN-1028",
    type: "settlement",
    method: "bank_transfer",
    amount: 52400,
    status: "completed",
    runningBalance: 76600,
  },
  {
    id: "PMT-3401",
    date: "2026-07-16",
    agent: "Al-Barakah Commission House",
    consignmentId: "CSN-1039",
    type: "refund",
    method: "cash",
    amount: -4200,
    status: "pending",
    runningBalance: 210100,
  },
];

const STATUS_STYLES = {
  completed: "bg-[#3f8f43]/10 text-[#2f7d32] border-[#3f8f43]/30",
  pending: "bg-[#f0b84c]/20 text-[#8a5a12] border-[#f0b84c]/40",
  failed: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABEL = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

const TYPE_LABEL = {
  settlement: "Full settlement",
  partial_settlement: "Partial settlement",
  refund: "Refund",
};

const METHOD_LABEL = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
};

export default function SupplierPayments() {
  const [loading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const payments = MOCK_PAYMENTS;

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesQuery =
        query.trim() === "" ||
        p.agent.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase()) ||
        p.consignmentId.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [payments, query, statusFilter]);

  const stats = useMemo(() => {
    const totalReceived = payments
      .filter((p) => p.status === "completed" && p.amount > 0)
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);
    const currentBalance = payments[0]?.runningBalance ?? 0;
    const thisMonth = payments
      .filter(
        (p) =>
          p.status === "completed" &&
          p.amount > 0 &&
          new Date(p.date).getMonth() === new Date().getMonth()
      )
      .reduce((sum, p) => sum + p.amount, 0);
    return { totalReceived, pendingAmount, currentBalance, thisMonth };
  }, [payments]);

  return (
    <div className="min-h-full bg-[#faf9f5] px-6 py-8 sm:px-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#1e4620] mb-1.5">
            Payments &amp; settlements
          </h1>
          <p className="text-gray-500">
            Every settlement received from your agents, and your running
            account balance.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#1e4620] hover:bg-gray-50 transition-colors self-start"
        >
          <Download className="h-4 w-4" />
          Export ledger
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Current balance"
          value={`PKR ${stats.currentBalance.toLocaleString()}`}
          accent
        />
        <StatCard
          icon={<Banknote className="h-5 w-5" />}
          label="Total received"
          value={`PKR ${stats.totalReceived.toLocaleString()}`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Received this month"
          value={`PKR ${stats.thisMonth.toLocaleString()}`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Pending settlements"
          value={`PKR ${stats.pendingAmount.toLocaleString()}`}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus-within:border-[#1e4620] focus-within:ring-2 focus-within:ring-[#1e4620]/10 transition-shadow">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by agent, payment ID, or consignment…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="outline-none text-sm text-gray-800 bg-transparent appearance-none cursor-pointer pr-5"
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 -ml-6 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Loading payments…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">No payments match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e4620]/5 text-left text-gray-600">
                  <Th>Payment</Th>
                  <Th>Date</Th>
                  <Th>Agent</Th>
                  <Th>Consignment</Th>
                  <Th>Type</Th>
                  <Th>Method</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Balance</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#faf9f5] transition-colors">
                    <Td className="font-medium text-[#1e4620]">{p.id}</Td>
                    <Td className="text-gray-500">
                      {new Date(p.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Td>
                    <Td>{p.agent}</Td>
                    <Td className="text-gray-500">{p.consignmentId}</Td>
                    <Td>{TYPE_LABEL[p.type]}</Td>
                    <Td className="text-gray-500">{METHOD_LABEL[p.method]}</Td>
                    <Td className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          p.amount < 0 ? "text-red-600" : "text-[#2f7d32]"
                        }`}
                      >
                        {p.amount < 0 ? (
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                        )}
                        {p.amount < 0 ? "-" : ""}PKR{" "}
                        {Math.abs(p.amount).toLocaleString()}
                      </span>
                    </Td>
                    <Td className="text-right font-medium">
                      PKR {p.runningBalance.toLocaleString()}
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[p.status]}`}
                      >
                        {STATUS_LABEL[p.status]}
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