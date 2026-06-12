"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";
import { apiRequest } from "@/lib/api";

type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";

type ReminderType =
  | "expiry_3_days"
  | "expiry_1_day"
  | "expiry_today"
  | "expired"
  | "payment_due"
  | "partial_payment";

type ReminderChannel = "manual_whatsapp" | "manual_call" | "sms" | "email";

type ReminderMember = {
  _id: string;
  memberCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status?: string;
};

type ReminderSubscription = {
  _id: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  paymentStatus?: string;
  gracePeriodDays?: number;
  planSnapshot?: {
    name?: string;
    type?: string;
    price?: number;
    durationInDays?: number;
  };
};

type Reminder = {
  _id: string;
  type: ReminderType;
  channel: ReminderChannel;
  status: ReminderStatus;
  scheduledFor: string;
  message: string;
  phone: string;
  whatsappUrl?: string;
  sentAt?: string | null;
  failedAt?: string | null;
  failureReason?: string;
  cancelledAt?: string | null;
  notes?: string;
  member?: ReminderMember;
  subscription?: ReminderSubscription;
  memberSnapshot?: {
    memberCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: string;
  };
  subscriptionSnapshot?: {
    status?: string;
    paymentStatus?: string;
    planName?: string;
    planPrice?: number;
    startsAt?: string;
    endsAt?: string;
    gracePeriodDays?: number;
  };
};

type RemindersResponseData = {
  reminders: Reminder[];
};

type GenerateRemindersResponseData = {
  createdCount: number;
  existingCount: number;
  skippedCount: number;
  createdReminders: Reminder[];
  skipped: {
    memberId?: string;
    subscriptionId?: string;
    reason: string;
  }[];
};

type ReminderSummaryResponseData = {
  totals: {
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  };
  byType: {
    type: ReminderType;
    status: ReminderStatus;
    count: number;
  }[];
  latestPending: Reminder[];
};

function getMemberName(
  member?: ReminderMember,
  fallback?: Reminder["memberSnapshot"],
) {
  const firstName = member?.firstName || fallback?.firstName || "";
  const lastName = member?.lastName || fallback?.lastName || "";

  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Unknown member";
}

function normalizeText(value: unknown) {
  return String(value || "").toLowerCase();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatReminderType(type: string) {
  return type.replaceAll("_", " ");
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

const inputClass =
  "h-11 w-full rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]";

const selectClass =
  "h-11 w-full appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-[#e8ff5f]";

function ReminderCard({
  reminder,
  onMarkSent,
  onMarkFailed,
  onCancel,
  actionId,
}: {
  reminder: Reminder;
  onMarkSent: (reminder: Reminder) => void;
  onMarkFailed: (reminder: Reminder) => void;
  onCancel: (reminder: Reminder) => void;
  actionId: string;
}) {
  const memberCode =
    reminder.member?.memberCode || reminder.memberSnapshot?.memberCode || "—";

  const phone =
    reminder.member?.phone || reminder.phone || reminder.memberSnapshot?.phone;

  const planName =
    reminder.subscription?.planSnapshot?.name ||
    reminder.subscriptionSnapshot?.planName ||
    "No plan";

  const planPrice =
    reminder.subscription?.planSnapshot?.price ||
    reminder.subscriptionSnapshot?.planPrice ||
    0;

  const isBusy = actionId === reminder._id || Boolean(actionId);

  return (
    <div className="rounded-[1.5rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-zinc-950">
            {getMemberName(reminder.member, reminder.memberSnapshot)}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">
            {memberCode} · {phone || "No phone"}
          </p>
        </div>

        <StatusPill status={reminder.status} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.1rem] bg-white/70 p-3 ring-1 ring-black/5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Type
          </p>
          <p className="mt-2 text-[13px] font-medium capitalize text-zinc-950">
            {formatReminderType(reminder.type)}
          </p>
        </div>

        <div className="rounded-[1.1rem] bg-white/70 p-3 ring-1 ring-black/5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Plan
          </p>
          <p className="mt-2 text-[13px] font-medium text-zinc-950">
            {planName}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">
            {formatMoney(planPrice)}
          </p>
        </div>

        <div className="rounded-[1.1rem] bg-white/70 p-3 ring-1 ring-black/5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Scheduled
          </p>
          <p className="mt-2 text-[13px] font-medium text-zinc-950">
            {formatDateTime(reminder.scheduledFor)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[1.2rem] bg-white/70 p-4 ring-1 ring-black/5">
        <p className="text-[12px] leading-6 text-zinc-700">
          {reminder.message}
        </p>
      </div>

      {reminder.failureReason ? (
        <div className="mt-3 rounded-[1.2rem] bg-red-50 p-3 text-[12px] text-red-700 ring-1 ring-red-100">
          Failed: {reminder.failureReason}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12px] text-zinc-500">
          Channel:{" "}
          <span className="capitalize text-zinc-700">
            {reminder.channel.replace("_", " ")}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {reminder.whatsappUrl ? (
            <a
              href={reminder.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="grid h-9 place-items-center rounded-full bg-[#e8ff5f] px-4 text-[12px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/5 transition hover:scale-[0.98]"
            >
              Open WhatsApp
            </a>
          ) : null}

          {reminder.status === "pending" ? (
            <>
              <button
                onClick={() => onMarkSent(reminder)}
                disabled={isBusy}
                className="h-9 rounded-full bg-white px-4 text-[12px] font-medium text-emerald-700 shadow-sm ring-1 ring-black/5 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark sent
              </button>

              <button
                onClick={() => onMarkFailed(reminder)}
                disabled={isBusy}
                className="h-9 rounded-full bg-white px-4 text-[12px] font-medium text-amber-700 shadow-sm ring-1 ring-black/5 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Failed
              </button>

              <button
                onClick={() => onCancel(reminder)}
                disabled={isBusy}
                className="h-9 rounded-full bg-white px-4 text-[12px] font-medium text-red-600 shadow-sm ring-1 ring-black/5 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [summary, setSummary] = useState<ReminderSummaryResponseData | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReminderStatus>(
    "pending",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | ReminderType>("all");

  const [channel, setChannel] = useState<ReminderChannel>("manual_whatsapp");
  const [expiringInDays, setExpiringInDays] = useState("3");
  const [includePaymentDue, setIncludePaymentDue] = useState(true);
  const [includeExpired, setIncludeExpired] = useState(true);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionId, setActionId] = useState("");

  const loadReminderData = useCallback(async () => {
    try {
      const [remindersResponse, summaryResponse] = await Promise.all([
        apiRequest<RemindersResponseData>("/reminders?limit=100"),
        apiRequest<ReminderSummaryResponseData>("/reminders/summary"),
      ]);

      setReminders(remindersResponse.data?.reminders || []);
      setSummary(summaryResponse.data || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load reminders.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReminderData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadReminderData]);

  const filteredReminders = useMemo(() => {
    return reminders.filter((reminder) => {
      const searchable = [
        getMemberName(reminder.member, reminder.memberSnapshot),
        reminder.member?.memberCode,
        reminder.memberSnapshot?.memberCode,
        reminder.phone,
        reminder.type,
        reminder.status,
        reminder.message,
        reminder.subscription?.planSnapshot?.name,
        reminder.subscriptionSnapshot?.planName,
      ].join(" ");

      const matchesSearch = normalizeText(searchable).includes(
        normalizeText(searchQuery),
      );

      const matchesStatus =
        statusFilter === "all" || reminder.status === statusFilter;

      const matchesType = typeFilter === "all" || reminder.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [reminders, searchQuery, statusFilter, typeFilter]);

  async function handleGenerateReminders() {
    setError("");
    setSuccessMessage("");
    setIsGenerating(true);

    const numericExpiringInDays = Number(expiringInDays);

    if (
      Number.isNaN(numericExpiringInDays) ||
      numericExpiringInDays < 1 ||
      numericExpiringInDays > 30
    ) {
      setError("Expiring in days must be between 1 and 30.");
      setIsGenerating(false);
      return;
    }

    try {
      const response = await apiRequest<GenerateRemindersResponseData>(
        "/reminders/generate",
        {
          method: "POST",
          body: {
            channel,
            expiringInDays: numericExpiringInDays,
            includePaymentDue,
            includeExpired,
          },
        },
      );

      const createdCount = response.data?.createdCount || 0;
      const existingCount = response.data?.existingCount || 0;
      const skippedCount = response.data?.skippedCount || 0;

      setSuccessMessage(
        `Generated ${createdCount} reminder(s). ${existingCount} already existed. ${skippedCount} skipped.`,
      );

      await loadReminderData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate reminders.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleMarkSent(reminder: Reminder) {
    setError("");
    setSuccessMessage("");
    setActionId(reminder._id);

    try {
      const response = await apiRequest<{ reminder: Reminder }>(
        `/reminders/${reminder._id}/sent`,
        {
          method: "PATCH",
          body: {
            notes: "Sent from admin reminder queue.",
          },
        },
      );

      setSuccessMessage(response.message || "Reminder marked as sent.");

      await loadReminderData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark reminder as sent.",
      );
    } finally {
      setActionId("");
    }
  }

  async function handleMarkFailed(reminder: Reminder) {
    const reason = window.prompt("Why did this reminder fail?");

    if (!reason?.trim()) return;

    setError("");
    setSuccessMessage("");
    setActionId(reminder._id);

    try {
      const response = await apiRequest<{ reminder: Reminder }>(
        `/reminders/${reminder._id}/failed`,
        {
          method: "PATCH",
          body: {
            failureReason: reason.trim(),
            notes: "Failed from admin reminder queue.",
          },
        },
      );

      setSuccessMessage(response.message || "Reminder marked as failed.");

      await loadReminderData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark reminder as failed.",
      );
    } finally {
      setActionId("");
    }
  }

  async function handleCancel(reminder: Reminder) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reminder?",
    );

    if (!confirmed) return;

    setError("");
    setSuccessMessage("");
    setActionId(reminder._id);

    try {
      const response = await apiRequest<{ reminder: Reminder }>(
        `/reminders/${reminder._id}/cancel`,
        {
          method: "PATCH",
          body: {
            notes: "Cancelled from admin reminder queue.",
          },
        },
      );

      setSuccessMessage(response.message || "Reminder cancelled.");

      await loadReminderData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel reminder.",
      );
    } finally {
      setActionId("");
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.7rem] bg-white/55 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Loading reminders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <MiniMetric
          label="Pending"
          value={summary?.totals.pending || 0}
          helper="Needs staff action"
        />
        <MiniMetric
          label="Sent"
          value={summary?.totals.sent || 0}
          helper="Already contacted"
        />
        <MiniMetric
          label="Failed"
          value={summary?.totals.failed || 0}
          helper="Could not reach member"
        />
        <MiniMetric
          label="Cancelled"
          value={summary?.totals.cancelled || 0}
          helper="No longer needed"
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Reminders
            </p>
            <h2 className="mt-1 text-[28px] font-medium tracking-[-0.04em] text-zinc-950">
              Reminder Queue
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              Generate WhatsApp-ready reminders for unpaid, partial, expired and
              expiring memberships.
            </p>
          </div>

          <button
            onClick={loadReminderData}
            className="h-10 rounded-full bg-white px-5 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">
        <div className="space-y-4 rounded-[1.7rem] bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
          <div>
            <h3 className="text-[16px] font-medium text-zinc-950">
              Generate reminders
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Create today’s reminder queue. Duplicates are automatically
              prevented by the API.
            </p>
          </div>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Channel
            </span>
            <select
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value as ReminderChannel)
              }
              className={selectClass}
            >
              <option value="manual_whatsapp">Manual WhatsApp</option>
              <option value="manual_call">Manual call</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Expiring in days
            </span>
            <input
              value={expiringInDays}
              onChange={(event) => setExpiringInDays(event.target.value)}
              className={inputClass}
              inputMode="numeric"
              placeholder="3"
            />
          </label>

          <div className="space-y-3 rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
            <label className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-zinc-700">
                Include unpaid and partial payments
              </span>
              <input
                type="checkbox"
                checked={includePaymentDue}
                onChange={(event) => setIncludePaymentDue(event.target.checked)}
                className="size-4 accent-[#e8ff5f]"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-zinc-700">
                Include expired subscriptions
              </span>
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={(event) => setIncludeExpired(event.target.checked)}
                className="size-4 accent-[#e8ff5f]"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-[1.3rem] bg-red-50 p-4 text-[13px] text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-[1.3rem] bg-emerald-50 p-4 text-[13px] text-emerald-700 ring-1 ring-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <button
            onClick={handleGenerateReminders}
            disabled={isGenerating}
            className="h-12 w-full rounded-full bg-[#e8ff5f] text-[13px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/5 transition hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Generating reminders..." : "Generate reminders"}
          </button>
        </div>

        <div className="min-w-0 space-y-4">
          <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <label className="relative h-10 min-w-[240px] flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500">
                  ⌕
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search member, phone, reminder..."
                  className="h-full w-full rounded-2xl border-0 bg-white pl-9 pr-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]"
                />
              </label>

              <div className="flex shrink-0 flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | ReminderStatus,
                    )
                  }
                  className="h-10 appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-[#e8ff5f]"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value as "all" | ReminderType)
                  }
                  className="h-10 appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-[#e8ff5f]"
                >
                  <option value="all">All types</option>
                  <option value="payment_due">Payment due</option>
                  <option value="partial_payment">Partial payment</option>
                  <option value="expiry_3_days">Expiring soon</option>
                  <option value="expiry_1_day">Expires tomorrow</option>
                  <option value="expiry_today">Expires today</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-[1.7rem] bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[13px] font-medium text-zinc-950">
                Reminder records
              </p>
              <p className="text-[12px] text-zinc-500">
                {filteredReminders.length} record(s)
              </p>
            </div>

            <div className="space-y-3">
              {filteredReminders.length === 0 ? (
                <div className="rounded-[1.4rem] bg-[#f4f4f2] px-5 py-14 text-center text-[13px] text-zinc-500">
                  No reminders found.
                </div>
              ) : (
                filteredReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder._id}
                    reminder={reminder}
                    onMarkSent={handleMarkSent}
                    onMarkFailed={handleMarkFailed}
                    onCancel={handleCancel}
                    actionId={actionId}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
