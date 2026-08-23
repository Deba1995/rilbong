"use client";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Users,
  IndianRupee,
  Settings,
  ExternalLink,
  Loader2,
  Ticket,
  Download,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  LogOut,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { getEvents } from "@/lib/events-store";
import type { EventDef } from "@/lib/event-schema";
import type { Registration } from "@/lib/registrations-store-admin";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Brand palette — same tokens as the public registration page, so admin and public feel like one product
const NAVY = "#1a2b4c";
const BLUE = "#2f6fed";
const CHART_COLORS = [
  "#2f6fed",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

function displayValue(
  val: string | string[] | undefined | null,
  event: EventDef,
  fieldId: string,
): string {
  if (val === undefined || val === null || val === "") return "—";
  const field = event.fields.find((f) => f.id === fieldId);
  const resolve = (v: string) =>
    field?.options?.find((o) => o.id === v)?.label ?? v;
  return Array.isArray(val) ? val.map(resolve).join(", ") : resolve(val);
}

// A registration only counts as real money once it's actually confirmed —
// 'pending' and 'failed' rows still carry an `amount` (set at draft-creation
// time, before payment succeeds), so status must always be checked before
// summing anything financial.
function isConfirmed(r: Registration): boolean {
  return r.status === "paid" || r.status === "free_confirmed";
}

export default function AdminPage() {
  const [events, setEvents] = useState<EventDef[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);

  const [ticketFilter, setTicketFilter] = useState<string>("all");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});

  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  useEffect(() => {
    setIsLoadingEvents(true);
    getEvents().then((all) => {
      setEvents(all);
      if (all.length > 0) setEventId(all[0].id);
      setIsLoadingEvents(false);
    });
  }, []);

  useEffect(() => {
    if (!eventId) {
      setRegistrations([]);
      return;
    }
    setTicketFilter("all");
    setFieldFilters({});
    setIsLoadingRegs(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setRegistrations([]);
        setIsLoadingRegs(false);
        return;
      }
      fetch("/api/admin/registrations", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const allRegs: Registration[] = data.registrations || [];
          setRegistrations(allRegs.filter((r) => r.eventId === eventId));
          setIsLoadingRegs(false);
        })
        .catch((err) => {
          console.error("Failed to fetch registrations:", err);
          setRegistrations([]);
          setIsLoadingRegs(false);
        });
    });
  }, [eventId]);

  const event = events.find((e) => e.id === eventId);

  const customerFields =
    event?.fields.filter((f) => f.filledBy === "customer") ?? [];
  const filterableFields = customerFields.filter(
    (f) => f.type === "select" || f.type === "radio",
  );

  const filteredRegistrations = registrations.filter((r) => {
    if (ticketFilter !== "all" && r.ticketId !== ticketFilter) return false;
    for (const [fieldId, filterVal] of Object.entries(fieldFilters)) {
      if (filterVal !== "all" && r.values[fieldId] !== filterVal) return false;
    }
    return true;
  });

  // ---- Confirmed vs at-risk split — this is the fix ----
  // Revenue, avg value, and both charts must only reflect money that actually
  // landed. Pending/failed registrations are tracked separately so a payment
  // failure is a visible flag on the dashboard, not silently folded into
  // "revenue" and not silently hidden either.
  const confirmedRegistrations = useMemo(
    () => filteredRegistrations.filter(isConfirmed),
    [filteredRegistrations],
  );
  const atRiskRegistrations = useMemo(
    () => filteredRegistrations.filter((r) => !isConfirmed(r)),
    [filteredRegistrations],
  );

  const revenue = confirmedRegistrations.reduce(
    (sum, r) => sum + (r.amount || 0),
    0,
  );
  const atRiskAmount = atRiskRegistrations.reduce(
    (sum, r) => sum + (r.amount || 0),
    0,
  );

  const avgTicketValue =
    confirmedRegistrations.length > 0
      ? Math.round(revenue / confirmedRegistrations.length)
      : 0;

  // ---- Insights (now sourced from confirmed-only registrations) ----

  const ticketDistribution = useMemo(() => {
    if (!event) return [];
    const counts = new Map<string, number>();
    for (const r of confirmedRegistrations) {
      counts.set(r.ticketId, (counts.get(r.ticketId) || 0) + 1);
    }
    return event.tickets
      .map((t) => ({ name: t.name, value: counts.get(t.id) || 0 }))
      .filter((d) => d.value > 0);
  }, [event, confirmedRegistrations]);

  const statusBreakdown = useMemo(() => {
    // This one intentionally still looks at ALL filtered registrations —
    // its whole job is showing the paid/pending/failed split, so it must
    // include the non-confirmed rows to be meaningful.
    const counts = { paid: 0, pending: 0, failed: 0 };
    for (const r of filteredRegistrations) {
      const s = r.status || "paid";
      if (s === "paid" || s === "free_confirmed") counts.paid++;
      else if (s === "failed") counts.failed++;
      else counts.pending++;
    }
    return counts;
  }, [filteredRegistrations]);

  const registrationsByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of confirmedRegistrations) {
      // Strictly formatted to IST (Asia/Kolkata)
      const day = new Date(r.createdAt).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
      });
      counts.set(day, (counts.get(day) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([day, count]) => ({ day, count }))
      .slice(-14);
  }, [confirmedRegistrations]);

  const downloadCSV = () => {
    if (!event) return;

    const headers = [
      "Registration ID",
      "Ticket/Pass",
      ...customerFields.map((f) => f.label),
      "Amount Paid (INR)",
      "Payment Status",
      "Razorpay Order ID",
      "Razorpay Payment ID",
      "Terms Accepted",
      "Registration Date",
    ];

    // CSV export intentionally still includes every filtered row (paid, pending,
    // failed) — this is a full audit export, not a revenue summary, so hiding
    // non-confirmed rows here would remove the exact records you'd need to
    // investigate a payment discrepancy.
    const rows = filteredRegistrations.map((r) => {
      const ticketName =
        event.tickets.find((t) => t.id === r.ticketId)?.name || "Unknown";
      const fieldVals = customerFields.map((f) => {
        const val = displayValue(r.values[f.id], event, f.id);
        const cleanVal = String(val).replace(/"/g, '""');
        if (f.type === "phone" || f.type === "number") return `="${cleanVal}"`;
        return `"${cleanVal}"`;
      });
      // Strictly formatted to IST for CSV export
      const date = new Date(r.createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      return [
        `"${r.id}"`,
        `"${ticketName}"`,
        ...fieldVals,
        r.amount || 0,
        `"${r.status || "paid"}"`,
        `"${r.razorpayOrderId || "—"}"`,
        `"${r.razorpayPaymentId || "—"}"`,
        `"${r.termsAccepted ? "Yes" : "No"}"`,
        `"${date}"`,
      ].join(",");
    });

    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join(
      "\n",
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${event.title.replace(/\s+/g, "_")}_Attendees.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoadingEvents) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] text-[#5b6472] gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: BLUE }} />
        <p className="text-sm font-medium">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <AdminAuthGuard>
      <main className="min-h-screen bg-[#f7f8fa] text-[#1a2b4c] px-6 py-10 sm:px-10 font-sans pb-24">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4c]">
                Registrations Dashboard
              </h1>
              <p className="mt-1 text-sm text-[#5b6472] max-w-2xl">
                Live data from your Supabase database — attendee insights,
                distribution, and CSV export.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {events.length > 0 && (
                <select
                  value={eventId ?? ""}
                  onChange={(e) => setEventId(e.target.value)}
                  className="rounded-lg border border-[#d7dbe3] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] outline-none focus:border-[#2f6fed] focus:ring-2 focus:ring-[#2f6fed]/15 shadow-sm cursor-pointer"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              )}
              <a
                href="/admin/events"
                className="inline-flex items-center gap-2 rounded-lg bg-[#d7dbe3] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c2c8d4] transition shadow-sm"
              >
                <Settings size={16} /> Event Builder
              </a>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7dbe3] bg-white px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition shadow-sm cursor-pointer"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center border-2 border-dashed border-[#d7dbe3] bg-white rounded-2xl py-20 text-[#94a3b8]">
              <Ticket size={48} className="mb-4 opacity-30" />
              <h3 className="text-lg font-bold text-[#334155] mb-1">
                No events yet
              </h3>
              <p className="text-sm mb-4">
                Create your first event to start accepting registrations.
              </p>
              <a
                href="/admin/events"
                className="rounded-lg px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: BLUE }}
              >
                Create Event
              </a>
            </div>
          ) : (
            event && (
              <div className="animate-in fade-in duration-300">
                {/* KPI Cards */}
                <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-[#94a3b8] text-xs font-bold uppercase tracking-wider mb-2">
                      <Users size={16} style={{ color: BLUE }} /> Attendees
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-[#1a2b4c]">
                        {isLoadingRegs ? "–" : confirmedRegistrations.length}
                      </p>
                      <p className="text-xs text-[#94a3b8] mb-1">confirmed</p>
                    </div>
                    {!isLoadingRegs && atRiskRegistrations.length > 0 && (
                      <p className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={11} />{" "}
                        {atRiskRegistrations.length} pending/failed — not
                        counted
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-[#94a3b8] text-xs font-bold uppercase tracking-wider mb-2">
                      <IndianRupee size={16} className="text-emerald-500" />{" "}
                      Revenue
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-[#1a2b4c]">
                        {isLoadingRegs
                          ? "–"
                          : `₹${revenue.toLocaleString("en-IN")}`}
                      </p>
                      <p className="text-xs text-[#94a3b8] mb-1">confirmed</p>
                    </div>
                    {!isLoadingRegs && atRiskAmount > 0 && (
                      <p className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={11} /> ₹
                        {atRiskAmount.toLocaleString("en-IN")} pending/failed —
                        not counted
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-[#94a3b8] text-xs font-bold uppercase tracking-wider mb-2">
                      <TrendingUp size={16} className="text-violet-500" /> Avg.
                      Per Registration
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-[#1a2b4c]">
                        {isLoadingRegs
                          ? "–"
                          : `₹${avgTicketValue.toLocaleString("en-IN")}`}
                      </p>
                    </div>
                    <p className="mt-2 text-[11px] text-[#94a3b8]">
                      Based on confirmed registrations only
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-[#94a3b8] text-xs font-bold uppercase tracking-wider mb-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />{" "}
                      Paid / Pending / Failed
                    </div>
                    <div className="flex items-end gap-3 mt-1">
                      <span className="text-lg font-bold text-emerald-600">
                        {statusBreakdown.paid}
                      </span>
                      <span className="text-lg font-bold text-amber-500">
                        {statusBreakdown.pending}
                      </span>
                      <span className="text-lg font-bold text-rose-500">
                        {statusBreakdown.failed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Insights row: pie + trend */}
                <div className="mt-6 grid lg:grid-cols-5 gap-4">
                  {/* Ticket distribution pie chart */}
                  <div className="lg:col-span-2 rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#1a2b4c] mb-1">
                      Ticket Distribution
                    </h3>
                    <p className="text-xs text-[#94a3b8] mb-4">
                      Share of confirmed registrations by pass type
                    </p>
                    {ticketDistribution.length === 0 ? (
                      <div className="h-[220px] flex items-center justify-center text-sm text-[#94a3b8]">
                        No confirmed data for the current filters.
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={ticketDistribution}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={2}
                            >
                              {ticketDistribution.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                                  stroke="white"
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any, name: any) => [
                                `${value} registrations`,
                                String(name),
                              ]}
                              contentStyle={{
                                borderRadius: 8,
                                border: "1px solid #e6e8ec",
                                fontSize: 12,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-2 space-y-1.5">
                          {ticketDistribution.map((d, i) => {
                            const total = ticketDistribution.reduce(
                              (s, x) => s + x.value,
                              0,
                            );
                            const pct =
                              total > 0
                                ? Math.round((d.value / total) * 100)
                                : 0;
                            return (
                              <div
                                key={d.name}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="flex items-center gap-2 text-[#334155] font-medium">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        CHART_COLORS[i % CHART_COLORS.length],
                                    }}
                                  />
                                  {d.name}
                                </span>
                                <span className="text-[#94a3b8] font-mono">
                                  {d.value} · {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Registrations over time */}
                  <div className="lg:col-span-3 rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#1a2b4c] mb-1">
                      Registrations Over Time
                    </h3>
                    <p className="text-xs text-[#94a3b8] mb-4">
                      Daily confirmed sign-up volume (last 14 active days in
                      IST)
                    </p>
                    {registrationsByDay.length === 0 ? (
                      <div className="h-[220px] flex items-center justify-center text-sm text-[#94a3b8]">
                        No confirmed data for the current filters.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={registrationsByDay}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#eef0f3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            width={28}
                          />
                          <Tooltip
                            cursor={{ fill: "#2f6fed", fillOpacity: 0.06 }}
                            contentStyle={{
                              borderRadius: 8,
                              border: "1px solid #e6e8ec",
                              fontSize: 12,
                            }}
                          />
                          <Bar
                            dataKey="count"
                            name="Registrations"
                            fill={BLUE}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={36}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Filters & Actions Toolbar */}
                <div className="mt-6 bg-white border border-[#e6e8ec] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#334155] mr-2">
                      <Filter size={16} className="text-[#94a3b8]" /> Filters:
                    </div>

                    <select
                      value={ticketFilter}
                      onChange={(e) => setTicketFilter(e.target.value)}
                      className="rounded-lg border border-[#d7dbe3] bg-[#f7f8fa] px-3 py-1.5 text-xs font-medium text-[#334155] outline-none focus:border-[#2f6fed] cursor-pointer"
                    >
                      <option value="all">All Passes</option>
                      {event.tickets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    {filterableFields.map((f) => (
                      <select
                        key={f.id}
                        value={fieldFilters[f.id] || "all"}
                        onChange={(e) =>
                          setFieldFilters((prev) => ({
                            ...prev,
                            [f.id]: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-[#d7dbe3] bg-[#f7f8fa] px-3 py-1.5 text-xs font-medium text-[#334155] outline-none focus:border-[#2f6fed] cursor-pointer max-w-[150px] truncate"
                      >
                        <option value="all">All {f.label}</option>
                        {f.options?.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={`/register/${event.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition px-3 py-1.5"
                      style={{ color: BLUE }}
                    >
                      View Form <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={downloadCSV}
                      disabled={filteredRegistrations.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                    >
                      <Download size={14} /> Download CSV
                    </button>
                  </div>
                </div>

                {/* Data Table */}
                <div className="mt-4 overflow-x-auto rounded-2xl border border-[#e6e8ec] bg-white shadow-sm custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#f7f8fa] text-xs uppercase tracking-wider text-[#94a3b8] font-bold border-b border-[#e6e8ec]">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                          Ticket/Pass
                        </th>
                        {customerFields.map((f) => (
                          <th
                            key={f.id}
                            className="px-6 py-4 whitespace-nowrap min-w-[150px]"
                          >
                            {f.label}
                          </th>
                        ))}
                        <th className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                          Status
                        </th>
                        <th className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                          Amount
                        </th>
                        <th className="px-6 py-4 whitespace-nowrap min-w-[180px]">
                          Payment ID
                        </th>
                        <th className="px-6 py-4 whitespace-nowrap min-w-[180px]">
                          Registered On (IST)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f2f4]">
                      {isLoadingRegs ? (
                        <tr>
                          <td
                            colSpan={customerFields.length + 5}
                            className="px-6 py-12 text-center"
                          >
                            <div className="flex flex-col items-center justify-center text-[#94a3b8] gap-2">
                              <Loader2 size={24} className="animate-spin" />
                              <span className="text-sm font-medium">
                                Fetching attendees…
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredRegistrations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={customerFields.length + 5}
                            className="px-6 py-12 text-center text-[#5b6472]"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <Users size={32} className="opacity-20 mb-3" />
                              <p className="font-medium">
                                No registrations match your filters.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map((r) => {
                          const ticketName =
                            event.tickets.find((t) => t.id === r.ticketId)
                              ?.name || "Unknown";
                          const confirmed = isConfirmed(r);
                          return (
                            <tr
                              key={r.id}
                              className={`hover:bg-[#f7f8fa] transition-colors ${
                                r.status === "failed"
                                  ? "border-l-4 border-l-rose-400"
                                  : !confirmed
                                    ? "border-l-4 border-l-amber-400"
                                    : ""
                              }`}
                            >
                              <td className="px-6 py-4 font-semibold text-[#1a2b4c] whitespace-nowrap">
                                {ticketName}
                              </td>
                              {customerFields.map((f) => {
                                const rawVal = r.values[f.id];
                                const textVal = displayValue(
                                  rawVal,
                                  event,
                                  f.id,
                                );
                                const isFileUrl =
                                  f.type === "file" &&
                                  typeof rawVal === "string" &&
                                  rawVal.startsWith("http");
                                return (
                                  <td
                                    key={f.id}
                                    className="px-6 py-4 text-[#334155] whitespace-nowrap"
                                  >
                                    {isFileUrl ? (
                                      <a
                                        href={rawVal}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 hover:underline font-medium text-xs px-2.5 py-1 rounded-md"
                                        style={{
                                          color: BLUE,
                                          backgroundColor: "#eef4ff",
                                        }}
                                      >
                                        <ExternalLink size={12} /> View File
                                      </a>
                                    ) : (
                                      textVal
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-6 py-4 font-bold whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                                    confirmed
                                      ? "bg-emerald-100 text-emerald-800"
                                      : r.status === "failed"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {confirmed ? (
                                    <CheckCircle2 size={11} />
                                  ) : r.status === "failed" ? (
                                    <XCircle size={11} />
                                  ) : (
                                    <Clock size={11} />
                                  )}
                                  {r.status || "paid"}
                                </span>
                              </td>
                              <td
                                className={`px-6 py-4 font-bold whitespace-nowrap ${
                                  confirmed
                                    ? "text-[#1a2b4c]"
                                    : "text-[#94a3b8] line-through decoration-2"
                                }`}
                                title={
                                  confirmed
                                    ? undefined
                                    : "Not counted in Revenue — payment not confirmed"
                                }
                              >
                                ₹{(r.amount || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="px-6 py-4 text-[#94a3b8] font-mono text-xs whitespace-nowrap">
                                {r.razorpayPaymentId || "—"}
                              </td>
                              <td className="px-6 py-4 text-[#5b6472] whitespace-nowrap text-xs">
                                {/* Strictly formatted to IST */}
                                {new Date(r.createdAt).toLocaleString("en-IN", {
                                  timeZone: "Asia/Kolkata",
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `,
          }}
        />
      </main>
    </AdminAuthGuard>
  );
}