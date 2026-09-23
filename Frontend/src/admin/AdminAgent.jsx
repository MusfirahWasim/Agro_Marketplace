import { useEffect, useState } from "react";
import {
  Clock,
  UserCheck,
  UserX,
  Check,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import Topbar from "./Topbar";
import { getPendingAgents, getAgents, approveAgent, rejectAgent } from "../handlers/admin";

/**
 * AdminAgents.jsx
 *
 * Approve/reject commission-agent signups, and browse agents who are
 * already approved, split by active/inactive.
 *
 * Visual system matches LoginPage.jsx / AdminDashboard.jsx: Fraunces for
 * display type, Inter for body, Noto Nastaliq Urdu when RTL, same
 * forest/gold palette, colors via inline style, useLanguage()/t() for copy.
 *
 * Expects on ../handlers/admin.js:
 *   getPendingAgents()            -> agents with approval_status === "pending"
 *   getAgents(status)             -> status: "active" | "inactive"
 *                                     (approved agents, split by is_active)
 *   approveAgent(agentId)         -> resolves on success
 *   rejectAgent(agentId, reason)  -> resolves on success, reason optional
 *
 * getAgents("active"/"inactive") isn't named explicitly in the V2 spec —
 * only list_pending_agents / approve_agent / reject_agent are — so this is
 * an assumed addition to admin_service.py / routers/admin.py needed to
 * back the "view active/inactive" half of this page. Adjust the handler
 * name/shape if the real endpoint differs.
 */

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  goldDark: "#d99e2f",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  muted: "#6b7568",
  border: "#d9ddce",
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

const TABS = [
  { key: "pending", icon: Clock, labelKey: "admin.agents.tabs.pending" },
  { key: "active", icon: UserCheck, labelKey: "admin.agents.tabs.active" },
  { key: "inactive", icon: UserX, labelKey: "admin.agents.tabs.inactive" },
];

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function StatusBadge({ tab, t }) {
  const styles = {
    pending: { bg: COLORS.errorBg, color: COLORS.errorText, labelKey: "admin.agents.badge.pending" },
    active: { bg: "#e8f0e4", color: COLORS.forest, labelKey: "admin.agents.badge.active" },
    inactive: { bg: COLORS.greige, color: COLORS.muted, labelKey: "admin.agents.badge.inactive" },
  }[tab];

  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {t(styles.labelKey)}
    </span>
  );
}

function AgentCard({ agent, tab, t, isRTL, onApprove, onReject, actionState }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const busy = actionState === "approving" || actionState === "rejecting";

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border, backgroundColor: "white" }}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-medium"
          style={{ backgroundColor: COLORS.greige, color: COLORS.ink }}
        >
          {initials(agent.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`text-base truncate ${isRTL ? "font-urdu" : "font-display"}`}
              style={{ color: COLORS.ink }}
            >
              {agent.name}
            </h3>
            <StatusBadge tab={tab} t={t} />
          </div>

          <div className="mt-1.5 flex flex-col gap-1 text-xs" style={{ color: COLORS.muted }}>
            {agent.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={12} /> {agent.email}
              </span>
            )}
            {agent.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={12} /> {agent.phone}
              </span>
            )}
            {agent.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} /> {agent.city}
              </span>
            )}
            {agent.created_at && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {t("admin.agents.signedUp", {
                  date: new Date(agent.created_at).toLocaleDateString(isRTL ? "ur-PK" : "en-PK"),
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {tab === "pending" && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
          {!showReject ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onApprove(agent)}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-transform active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: COLORS.forest, color: "white" }}
              >
                {actionState === "approving" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {t("admin.agents.approve")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowReject(true)}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg border transition-transform active:scale-[0.98] disabled:opacity-60"
                style={{ borderColor: COLORS.errorText, color: COLORS.errorText }}
              >
                <X size={14} />
                {t("admin.agents.reject")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("admin.agents.rejectReasonPlaceholder")}
                rows={2}
                className="w-full text-sm rounded-lg border px-3 py-2 outline-none resize-none focus:ring-2"
                style={{ borderColor: COLORS.border }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(agent, reason)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg disabled:opacity-60"
                  style={{ backgroundColor: COLORS.errorText, color: "white" }}
                >
                  {actionState === "rejecting" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <X size={14} />
                  )}
                  {t("admin.agents.confirmReject")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setShowReject(false);
                    setReason("");
                  }}
                  className="text-sm font-medium py-2 px-3 rounded-lg"
                  style={{ color: COLORS.muted }}
                >
                  {t("admin.agents.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAgents() {
  const { t, isRTL } = useLanguage();
  const [tab, setTab] = useState("pending");
  const [agents, setAgents] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [actionStates, setActionStates] = useState({}); // agentId -> "approving" | "rejecting"
  const [banner, setBanner] = useState(null); // { type: "success" | "error", message }

  async function load(activeTab) {
    setStatus("loading");
    setBanner(null);
    try {
      const result = activeTab === "pending" ? await getPendingAgents() : await getAgents(activeTab);
      setAgents(result ?? []);
      setStatus("ready");
    } catch (err) {
      console.error("Failed to load agents:", err);
      setStatus("error");
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleApprove(agent) {
    setActionStates((s) => ({ ...s, [agent.id]: "approving" }));
    try {
      await approveAgent(agent.id);
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      setBanner({ type: "success", message: t("admin.agents.approvedToast", { name: agent.name }) });
    } catch (err) {
      console.error("Failed to approve agent:", err);
      setBanner({ type: "error", message: t("admin.agents.actionError") });
    } finally {
      setActionStates((s) => {
        const next = { ...s };
        delete next[agent.id];
        return next;
      });
    }
  }

  async function handleReject(agent, reason) {
    setActionStates((s) => ({ ...s, [agent.id]: "rejecting" }));
    try {
      await rejectAgent(agent.id, reason);
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      setBanner({ type: "success", message: t("admin.agents.rejectedToast", { name: agent.name }) });
    } catch (err) {
      console.error("Failed to reject agent:", err);
      setBanner({ type: "error", message: t("admin.agents.actionError") });
    } finally {
      setActionStates((s) => {
        const next = { ...s };
        delete next[agent.id];
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
      `}</style>

      <Topbar />

      <div dir={isRTL ? "rtl" : "ltr"} className="flex-1 w-full font-body px-6 sm:px-12 py-10">
        <header className="pb-5 mb-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className={`text-3xl mb-1 ${isRTL ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
            {t("admin.agents.title")}
          </h1>
          <p className="text-sm max-w-[52ch]" style={{ color: COLORS.muted }}>
            {t("admin.agents.subtitle")}
          </p>
        </header>

        <div
          className="inline-flex gap-1 p-1 rounded-xl mb-6"
          style={{ backgroundColor: COLORS.greige }}
        >
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 text-sm font-medium py-2 px-3.5 rounded-lg transition-colors"
              style={
                tab === key
                  ? { backgroundColor: COLORS.forest, color: "white" }
                  : { color: COLORS.muted }
              }
            >
              <Icon size={14} />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {banner && (
          <div
            className="text-sm rounded-lg px-4 py-3 mb-5"
            style={
              banner.type === "success"
                ? { backgroundColor: "#e8f0e4", color: COLORS.forest }
                : { backgroundColor: COLORS.errorBg, color: COLORS.errorText }
            }
          >
            {banner.message}
          </div>
        )}

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: COLORS.muted }}>
            <Loader2 size={16} className="animate-spin" />
            {t("admin.agents.loading")}
          </div>
        )}

        {status === "error" && (
          <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            {t("admin.agents.loadError")}
          </div>
        )}

        {status === "ready" && agents.length === 0 && (
          <div
            className="text-sm rounded-xl px-4 py-10 text-center border"
            style={{ borderColor: COLORS.border, color: COLORS.muted }}
          >
            {t(`admin.agents.empty.${tab}`)}
          </div>
        )}

        {status === "ready" && agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                tab={tab}
                t={t}
                isRTL={isRTL}
                onApprove={handleApprove}
                onReject={handleReject}
                actionState={actionStates[agent.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}