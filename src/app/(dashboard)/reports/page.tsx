"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";
import { apiRequest } from "@/lib/api";

type ReportPeriod = "today" | "week" | "month" | "custom";

type RevenueRange = {
  label: string;
  startDate: string;
  endDate: string;
};

type RevenueData = {
  totalRevenue: number;
  totalPayments: number;
};

type RevenueByMethod = {
  method: string;
  totalRevenue: number;
  totalPayments: number;
};

type RevenueReportData = {
  range: RevenueRange;
  revenue: RevenueData;
  byMethod: RevenueByMethod[];
};

type MemberReportData = {
  members: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    suspendedMembers: number;
    newMembersThisMonth: number;
  };
  monthRange: {
    startDate: string;
    endDate: string;
  };
};

type SubscriptionReportData = {
  subscriptions: {
    activeSubscriptions: number;
    scheduledSubscriptions: number;
    expiredSubscriptions: number;
    cancelledSubscriptions: number;
    suspendedSubscriptions: number;
    unpaidSubscriptions: number;
    partialSubscriptions: number;
    paidSubscriptions: number;
    expiringSoonSubscriptions: number;
  };
};

type AttendanceReportData = {
  range: RevenueRange;
  attendance: {
    totalAttempts: number;
    successfulEntries: number;
    uniqueSuccessfulMembers: number;
    allowedCount: number;
    warningCount: number;
    blockedCount: number;
    byDecisionCode: {
      decisionCode: string;
      count: number;
    }[];
  };
};

type DashboardReportData = {
  revenue: {
    today: RevenueData & {
      startDate: string;
      endDate: string;
    };
    week: RevenueData & {
      startDate: string;
      endDate: string;
    };
    month: RevenueData & {
      startDate: string;
      endDate: string;
    };
    pending: {
      totalPendingAmount: number;
      totalPendingPayments: number;
    };
  };

  members: MemberReportData["members"];

  subscriptions: SubscriptionReportData["subscriptions"];

  checkInsToday: AttendanceReportData["attendance"];

  reminders: {
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  };
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function toStartIsoDate(dateValue: string) {
  if (!dateValue) return undefined;
  return new Date(`${dateValue}T00:00:00.000`).toISOString();
}

function toEndIsoDate(dateValue: string) {
  if (!dateValue) return undefined;
  return new Date(`${dateValue}T23:59:59.999`).toISOString();
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStartInputValue() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function buildReportQuery({
  period,
  fromDate,
  toDate,
}: {
  period: ReportPeriod;
  fromDate: string;
  toDate: string;
}) {
  if (period === "custom") {
    const params = new URLSearchParams();

    const start = toStartIsoDate(fromDate);
    const end = toEndIsoDate(toDate);

    if (start) params.set("fromDate", start);
    if (end) params.set("toDate", end);

    const queryString = params.toString();

    return queryString ? `?${queryString}` : "";
  }

  return `?period=${period}`;
}

function MiniMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-[2.2rem] bg-white/55 px-5 py-4 shadow-sm ring-1 ring-black/5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-medium tracking-[-0.04em] text-zinc-950">
        {value}
      </p>
      <p className="mt-1 text-[12px] text-zinc-500">{helper}</p>
    </div>
  );
}

function ReportBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.7rem] bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-4">
        <h3 className="text-[16px] font-medium text-zinc-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-[13px] leading-6 text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function ProgressRow({
  label,
  value,
  total,
  helper,
}: {
  label: string;
  value: number;
  total: number;
  helper?: string;
}) {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="capitalize text-zinc-700">{formatLabel(label)}</span>
        <span className="font-medium text-zinc-950">{formatNumber(value)}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-[#e8ff5f]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {helper ? <p className="text-[12px] text-zinc-500">{helper}</p> : null}
    </div>
  );
}

function RevenueMethodTable({ rows }: { rows: RevenueByMethod[] }) {
  return (
    <div className="overflow-hidden rounded-[1.3rem] bg-[#f4f4f2] ring-1 ring-black/5">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-[#dededb] text-left">
            <th className="px-4 py-3 text-[12px] font-medium text-zinc-600">
              Method
            </th>
            <th className="px-4 py-3 text-[12px] font-medium text-zinc-600">
              Payments
            </th>
            <th className="px-4 py-3 text-right text-[12px] font-medium text-zinc-600">
              Revenue
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-10 text-center text-[13px] text-zinc-500"
              >
                No revenue by method for this period.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.method}
                className="border-b border-black/10 last:border-0"
              >
                <td className="px-4 py-3 text-[13px] capitalize text-zinc-700">
                  {row.method.replace("_", " ")}
                </td>

                <td className="px-4 py-3 text-[13px] text-zinc-700">
                  {row.totalPayments}
                </td>

                <td className="px-4 py-3 text-right text-[13px] font-medium text-zinc-950">
                  {formatMoney(row.totalRevenue)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const inputClass =
  "h-10 rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]";

const selectClass =
  "h-10 appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-[#e8ff5f]";

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [fromDate, setFromDate] = useState(getMonthStartInputValue());
  const [toDate, setToDate] = useState(getTodayInputValue());

  const [dashboard, setDashboard] = useState<DashboardReportData | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReportData | null>(
    null,
  );
  const [memberReport, setMemberReport] = useState<MemberReportData | null>(
    null,
  );
  const [subscriptionReport, setSubscriptionReport] =
    useState<SubscriptionReportData | null>(null);
  const [attendanceReport, setAttendanceReport] =
    useState<AttendanceReportData | null>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const reportQuery = useMemo(() => {
    return buildReportQuery({
      period,
      fromDate,
      toDate,
    });
  }, [period, fromDate, toDate]);

  const loadReports = useCallback(async () => {
    setError("");

    try {
      const [
        dashboardResponse,
        revenueResponse,
        memberResponse,
        subscriptionResponse,
        attendanceResponse,
      ] = await Promise.all([
        apiRequest<DashboardReportData>("/reports/dashboard"),
        apiRequest<RevenueReportData>(`/reports/revenue${reportQuery}`),
        apiRequest<MemberReportData>("/reports/members"),
        apiRequest<SubscriptionReportData>("/reports/subscriptions"),
        apiRequest<AttendanceReportData>(`/reports/attendance${reportQuery}`),
      ]);

      setDashboard(dashboardResponse.data || null);
      setRevenueReport(revenueResponse.data || null);
      setMemberReport(memberResponse.data || null);
      setSubscriptionReport(subscriptionResponse.data || null);
      setAttendanceReport(attendanceResponse.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, [reportQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadReports]);

  const revenueTotal = revenueReport?.revenue.totalRevenue || 0;
  const revenuePayments = revenueReport?.revenue.totalPayments || 0;

  const memberStats = memberReport?.members;
  const subscriptionStats = subscriptionReport?.subscriptions;
  const attendanceStats = attendanceReport?.attendance;

  const memberTotal = memberStats?.totalMembers || 0;
  const subscriptionTotal =
    (subscriptionStats?.activeSubscriptions || 0) +
    (subscriptionStats?.scheduledSubscriptions || 0) +
    (subscriptionStats?.expiredSubscriptions || 0) +
    (subscriptionStats?.cancelledSubscriptions || 0) +
    (subscriptionStats?.suspendedSubscriptions || 0);

  const attendanceTotal = attendanceStats?.totalAttempts || 0;

  if (isLoading) {
    return (
      <div className="rounded-[1.7rem] bg-white/55 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <MiniMetric
          label="Revenue"
          value={formatMoney(revenueTotal)}
          helper={`${revenuePayments} payment(s) in selected period`}
        />

        <MiniMetric
          label="Members"
          value={memberStats?.activeMembers || 0}
          helper={`${memberStats?.totalMembers || 0} total member(s)`}
        />

        <MiniMetric
          label="Check-ins"
          value={attendanceStats?.successfulEntries || 0}
          helper={`${attendanceStats?.blockedCount || 0} blocked attempt(s)`}
        />

        <MiniMetric
          label="Reminders"
          value={dashboard?.reminders.pending || 0}
          helper="Pending staff follow-up"
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Reports
            </p>
            <h2 className="mt-1 text-[28px] font-medium tracking-[-0.04em] text-zinc-950">
              Business Reports
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              Review revenue, members, subscriptions and attendance performance.
            </p>
          </div>

          <button
            onClick={loadReports}
            className="h-10 rounded-full bg-white px-5 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
            className={selectClass}
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="custom">Custom range</option>
          </select>

          {period === "custom" ? (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className={inputClass}
              />

              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className={inputClass}
              />
            </>
          ) : null}

          <div className="ml-auto text-[12px] text-zinc-500">
            {revenueReport?.range ? (
              <>
                {formatDate(revenueReport.range.startDate)} —{" "}
                {formatDate(revenueReport.range.endDate)}
              </>
            ) : (
              "No range selected"
            )}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.7rem] bg-red-50 p-4 text-[13px] text-red-700 shadow-sm ring-1 ring-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-4">
          <ReportBlock
            title="Revenue performance"
            description="Paid revenue and payment method breakdown for the selected period."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Total revenue</p>
                <p className="mt-2 text-[26px] font-medium tracking-[-0.04em] text-zinc-950">
                  {formatMoney(revenueTotal)}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Paid payments</p>
                <p className="mt-2 text-[26px] font-medium tracking-[-0.04em] text-zinc-950">
                  {revenuePayments}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Pending amount</p>
                <p className="mt-2 text-[26px] font-medium tracking-[-0.04em] text-zinc-950">
                  {formatMoney(
                    dashboard?.revenue.pending.totalPendingAmount || 0,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <RevenueMethodTable rows={revenueReport?.byMethod || []} />
            </div>
          </ReportBlock>

          <ReportBlock
            title="Attendance performance"
            description="Check-in attempts, successful entries, warnings and blocked entries."
          >
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Attempts</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {attendanceStats?.totalAttempts || 0}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Successful</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {attendanceStats?.successfulEntries || 0}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Warnings</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {attendanceStats?.warningCount || 0}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Blocked</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {attendanceStats?.blockedCount || 0}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {(attendanceStats?.byDecisionCode || []).length === 0 ? (
                <div className="rounded-[1.3rem] bg-[#f4f4f2] px-5 py-10 text-center text-[13px] text-zinc-500">
                  No attendance decision data for this period.
                </div>
              ) : (
                attendanceStats?.byDecisionCode.map((item) => (
                  <ProgressRow
                    key={item.decisionCode}
                    label={item.decisionCode}
                    value={item.count}
                    total={attendanceTotal}
                  />
                ))
              )}
            </div>
          </ReportBlock>
        </div>

        <div className="min-w-0 space-y-4">
          <ReportBlock
            title="Member health"
            description="Profile status and new member growth."
          >
            <div className="space-y-4">
              <ProgressRow
                label="Active members"
                value={memberStats?.activeMembers || 0}
                total={memberTotal}
                helper={`${memberStats?.newMembersThisMonth || 0} new this month`}
              />

              <ProgressRow
                label="Inactive members"
                value={memberStats?.inactiveMembers || 0}
                total={memberTotal}
              />

              <ProgressRow
                label="Suspended members"
                value={memberStats?.suspendedMembers || 0}
                total={memberTotal}
              />
            </div>
          </ReportBlock>

          <ReportBlock
            title="Subscription health"
            description="Membership status and payment state across the gym."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusPill
                status={`active ${subscriptionStats?.activeSubscriptions || 0}`}
              />
              <StatusPill
                status={`expired ${subscriptionStats?.expiredSubscriptions || 0}`}
              />
              <StatusPill
                status={`unpaid ${subscriptionStats?.unpaidSubscriptions || 0}`}
              />
            </div>

            <div className="space-y-4">
              <ProgressRow
                label="Active subscriptions"
                value={subscriptionStats?.activeSubscriptions || 0}
                total={subscriptionTotal}
              />

              <ProgressRow
                label="Scheduled subscriptions"
                value={subscriptionStats?.scheduledSubscriptions || 0}
                total={subscriptionTotal}
              />

              <ProgressRow
                label="Expired subscriptions"
                value={subscriptionStats?.expiredSubscriptions || 0}
                total={subscriptionTotal}
              />

              <ProgressRow
                label="Paid subscriptions"
                value={subscriptionStats?.paidSubscriptions || 0}
                total={
                  (subscriptionStats?.paidSubscriptions || 0) +
                  (subscriptionStats?.unpaidSubscriptions || 0) +
                  (subscriptionStats?.partialSubscriptions || 0)
                }
              />

              <ProgressRow
                label="Unpaid subscriptions"
                value={subscriptionStats?.unpaidSubscriptions || 0}
                total={
                  (subscriptionStats?.paidSubscriptions || 0) +
                  (subscriptionStats?.unpaidSubscriptions || 0) +
                  (subscriptionStats?.partialSubscriptions || 0)
                }
              />

              <ProgressRow
                label="Expiring soon"
                value={subscriptionStats?.expiringSoonSubscriptions || 0}
                total={subscriptionTotal}
              />
            </div>
          </ReportBlock>

          <ReportBlock
            title="Reminder workload"
            description="Manual WhatsApp/contact reminders that need attention."
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Pending</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {dashboard?.reminders.pending || 0}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Sent</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {dashboard?.reminders.sent || 0}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Failed</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {dashboard?.reminders.failed || 0}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Cancelled</p>
                <p className="mt-2 text-[24px] font-medium text-zinc-950">
                  {dashboard?.reminders.cancelled || 0}
                </p>
              </div>
            </div>
          </ReportBlock>
        </div>
      </section>
    </div>
  );
}
