"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import type {
  DashboardReport,
  RecentCheckIn,
  RecentPayment,
} from "@/lib/types";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getMemberName(member?: { firstName?: string; lastName?: string }) {
  if (!member) return "Unknown member";
  return `${member.firstName || ""} ${member.lastName || ""}`.trim();
}

function formatDateTime(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (["paid", "allowed", "sent", "active"].includes(status)) {
    return "text-emerald-600";
  }

  if (["pending", "warning", "partial", "scheduled"].includes(status)) {
    return "text-amber-600";
  }

  if (["blocked", "failed", "expired", "unpaid"].includes(status)) {
    return "text-red-500";
  }

  return "text-zinc-500";
}

function normalizeText(value: unknown) {
  return String(value || "").toLowerCase();
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

function PillLink({
  href,
  children,
  isActive = false,
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`grid h-11 place-items-center rounded-full px-5 text-[13px] transition ${
        isActive
          ? "bg-white text-zinc-950 shadow-sm ring-1 ring-black/5"
          : "text-zinc-600 hover:bg-white/70 hover:text-zinc-950"
      }`}
    >
      {children}
    </Link>
  );
}

function ActionLink({
  href,
  children,
  strong = false,
}: {
  href: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`grid h-10 place-items-center rounded-full px-5 text-[13px] transition ${
        strong
          ? "bg-white text-zinc-950 shadow-sm ring-1 ring-black/5 hover:bg-[#e8ff5f]"
          : "bg-white/60 text-zinc-600 ring-1 ring-black/5 hover:bg-white hover:text-zinc-950"
      }`}
    >
      {children}
    </Link>
  );
}

function PaymentRow({ payment }: { payment: RecentPayment }) {
  return (
    <tr className="border-b border-black/10 last:border-0">
      <td className="px-5 py-4 text-[13px] text-zinc-700">
        {payment.receiptNumber}
      </td>
      <td className="px-5 py-4 text-[13px] font-medium text-zinc-950">
        {getMemberName(payment.member)}
      </td>
      <td className="px-5 py-4 text-[13px] text-zinc-700">
        {payment.subscription?.planSnapshot?.name || "—"}
      </td>
      <td className="px-5 py-4 text-[13px] text-zinc-700">
        {formatMoney(payment.amount)}
      </td>
      <td className="px-5 py-4 text-[13px] capitalize text-zinc-700">
        {payment.method?.replace("_", " ")}
      </td>
      <td
        className={`px-5 py-4 text-[13px] font-medium capitalize ${statusClass(
          payment.status,
        )}`}
      >
        {payment.status}
      </td>
      <td className="px-5 py-4 text-right">
        <button className="rounded-full px-2 text-[18px] leading-none text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950">
          ...
        </button>
      </td>
    </tr>
  );
}

function CheckInRow({ checkIn }: { checkIn: RecentCheckIn }) {
  return (
    <tr className="border-b border-black/10 last:border-0">
      <td className="px-5 py-4 text-[13px] text-zinc-700">
        {checkIn.member?.memberCode || "—"}
      </td>
      <td className="px-5 py-4 text-[13px] font-medium text-zinc-950">
        {getMemberName(checkIn.member)}
      </td>
      <td className="px-5 py-4 text-[13px] text-zinc-700">
        {checkIn.subscription?.planSnapshot?.name || "No plan"}
      </td>
      <td className="px-5 py-4 text-[13px] text-zinc-700">
        {formatDateTime(checkIn.checkedInAt)}
      </td>
      <td
        className={`px-5 py-4 text-[13px] font-medium capitalize ${statusClass(
          checkIn.entryStatus,
        )}`}
      >
        {checkIn.entryStatus}
      </td>
      <td className="px-5 py-4 text-right">
        <button className="rounded-full px-2 text-[18px] leading-none text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950">
          ...
        </button>
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [activeTab, setActiveTab] = useState<"payments" | "checkins">(
    "payments",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response =
          await apiRequest<DashboardReport>("/reports/dashboard");

        if (!response.data) {
          throw new Error("Dashboard response missing data.");
        }

        setReport(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const tableRows = useMemo(() => {
    if (!report) return [];

    const rows =
      activeTab === "payments"
        ? report.activity.recentPayments
        : report.activity.recentCheckIns;

    return rows.filter((row) => {
      const memberName = getMemberName(row.member);
      const memberCode = row.member?.memberCode || "";
      const planName = row.subscription?.planSnapshot?.name || "";

      const rowStatus =
        activeTab === "payments"
          ? (row as RecentPayment).status
          : (row as RecentCheckIn).entryStatus;

      const searchable =
        activeTab === "payments"
          ? [
              (row as RecentPayment).receiptNumber,
              memberName,
              memberCode,
              planName,
              (row as RecentPayment).method,
              (row as RecentPayment).status,
            ].join(" ")
          : [
              memberName,
              memberCode,
              planName,
              (row as RecentCheckIn).entryStatus,
              (row as RecentCheckIn).decisionCode,
            ].join(" ");

      const matchesSearch = normalizeText(searchable).includes(
        normalizeText(searchQuery),
      );

      const matchesStatus =
        statusFilter === "all" || normalizeText(rowStatus) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeTab, report, searchQuery, statusFilter]);

  const statusOptions =
    activeTab === "payments"
      ? ["all", "paid", "pending", "failed", "refunded"]
      : ["all", "allowed", "warning", "blocked"];

  if (isLoading) {
    return (
      <div className="rounded-[1.7rem] bg-white/55 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.7rem] bg-red-50 p-8 text-[13px] text-red-700 shadow-sm ring-1 ring-red-200">
        {error}
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <MiniMetric
          label="Today"
          value={formatMoney(report.revenue.today.totalRevenue)}
          helper={`${report.revenue.today.totalPayments} payment(s)`}
        />
        <MiniMetric
          label="This week"
          value={formatMoney(report.revenue.week.totalRevenue)}
          helper={`${report.checkInsToday.successfulEntries} successful entries today`}
        />
        <MiniMetric
          label="Members"
          value={report.members.activeMembers}
          helper={`${report.members.newMembersThisMonth} new this month`}
        />
        <MiniMetric
          label="Attention"
          value={report.subscriptions.unpaidSubscriptions}
          helper={`${report.reminders.pending} pending reminder(s)`}
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap gap-2">
          <PillLink href="/dashboard" isActive>
            Gym Overview
          </PillLink>
          <PillLink href="/payments">Payment Management</PillLink>
          <PillLink href="/check-in">Check-in Control</PillLink>
          <PillLink href="/reminders">Reminder Queue</PillLink>
        </div>
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <ActionLink href="/members/new" strong>
              Add New Member +
            </ActionLink>

            <ActionLink href="/check-in">Check-in Member</ActionLink>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label className="relative h-10 w-[220px] max-w-full">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500">
                ⌕
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search table..."
                className="h-full w-full rounded-2xl border-0 bg-white pl-9 pr-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]"
              />
            </label>

            <label className="relative h-10">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-full appearance-none rounded-2xl border-0 bg-white py-0 pl-4 pr-10 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-[#e8ff5f]"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all"
                      ? "All statuses"
                      : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">
                ▾
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.7rem] bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex rounded-full bg-[#dededb] p-1">
            <button
              onClick={() => {
                setActiveTab("payments");
                setStatusFilter("all");
              }}
              className={`h-9 rounded-full px-5 text-[13px] transition ${
                activeTab === "payments"
                  ? "bg-[#e8ff5f] text-zinc-950"
                  : "text-zinc-600 hover:bg-white/60"
              }`}
            >
              Recent Payments
            </button>

            <button
              onClick={() => {
                setActiveTab("checkins");
                setStatusFilter("all");
              }}
              className={`h-9 rounded-full px-5 text-[13px] transition ${
                activeTab === "checkins"
                  ? "bg-[#e8ff5f] text-zinc-950"
                  : "text-zinc-600 hover:bg-white/60"
              }`}
            >
              Recent Check-ins
            </button>
          </div>

          <p className="hidden text-[12px] text-zinc-500 sm:block">
            Live data from GymFlow API
          </p>
        </div>

        <div className="overflow-x-auto rounded-[1.4rem] bg-[#f4f4f2]">
          <table className="min-w-full border-collapse">
            <thead>
              {activeTab === "payments" ? (
                <tr className="bg-[#dededb] text-left">
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Receipt
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Member
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Plan
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Method
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Status
                  </th>
                  <th className="px-5 py-4" />
                </tr>
              ) : (
                <tr className="bg-[#dededb] text-left">
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Member ID
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Member
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Plan
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Time
                  </th>
                  <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                    Entry
                  </th>
                  <th className="px-5 py-4" />
                </tr>
              )}
            </thead>

            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-[13px] text-zinc-500"
                  >
                    No recent{" "}
                    {activeTab === "payments" ? "payments" : "check-ins"} found.
                  </td>
                </tr>
              ) : activeTab === "payments" ? (
                (tableRows as RecentPayment[]).map((payment) => (
                  <PaymentRow key={payment._id} payment={payment} />
                ))
              ) : (
                (tableRows as RecentCheckIn[]).map((checkIn) => (
                  <CheckInRow key={checkIn._id} checkIn={checkIn} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <div className="rounded-[1.7rem] bg-white/55 p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-[12px] text-zinc-500">Blocked today</p>
          <p className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            {report.checkInsToday.blockedCount}
          </p>
        </div>

        <div className="rounded-[1.7rem] bg-white/55 p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-[12px] text-zinc-500">Expired subs</p>
          <p className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            {report.subscriptions.expiredSubscriptions}
          </p>
        </div>

        <div className="rounded-[1.7rem] bg-white/55 p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-[12px] text-zinc-500">Partial payments</p>
          <p className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            {report.subscriptions.partialSubscriptions}
          </p>
        </div>

        <div className="rounded-[1.7rem] bg-white/55 p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-[12px] text-zinc-500">Expiring soon</p>
          <p className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            {report.subscriptions.expiringSoonSubscriptions}
          </p>
        </div>
      </section>
    </div>
  );
}
