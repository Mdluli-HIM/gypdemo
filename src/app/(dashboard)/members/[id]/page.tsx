"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";
import { apiRequest } from "@/lib/api";
import type { CheckInRecord, Member, Payment, Reminder } from "@/lib/types";

type MemberResponseData = {
  member: Member;
};

type MemberPaymentsResponseData = {
  member: Member;
  payments: Payment[];
};

type MemberCheckInsResponseData = {
  member: Member;
  checkIns: CheckInRecord[];
};

type MemberRemindersResponseData = {
  member: Member;
  reminders: Reminder[];
};

type MemberSubscription = {
  _id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  paymentStatus: string;
  gracePeriodDays: number;
  planSnapshot: {
    name: string;
    type: string;
    price: number;
    durationInDays: number;
  };
};

type SubscriptionsResponseData = {
  subscriptions: MemberSubscription[];
};

type CreateCheckInResponseData = {
  checkIn: CheckInRecord;
  decision: {
    entryStatus: "allowed" | "warning" | "blocked";
    decisionCode: string;
    message: string;
    alreadyCheckedInToday: boolean;
  };
};

type GenerateRemindersResponseData = {
  createdCount: number;
  existingCount: number;
  skippedCount: number;
};

function formatMoney(value?: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

function getFullName(member?: Member | null) {
  if (!member) return "Unknown member";
  return `${member.firstName || ""} ${member.lastName || ""}`.trim();
}

function getPaymentTotal(payments: Payment[]) {
  return payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
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

function SectionCard({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.7rem] bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-medium text-zinc-950">{title}</h3>
          {helper ? (
            <p className="mt-1 text-[13px] leading-6 text-zinc-500">{helper}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.4rem] bg-[#f4f4f2] px-5 py-12 text-center text-[13px] text-zinc-500">
      {label}
    </div>
  );
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const [member, setMember] = useState<Member | null>(null);
  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "checkins" | "reminders"
  >("overview");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [quickAction, setQuickAction] = useState<"" | "checkin" | "reminder">(
    "",
  );

  const loadMemberProfile = useCallback(async () => {
    setError("");

    try {
      const [
        memberResponse,
        subscriptionResponse,
        paymentsResponse,
        checkInsResponse,
        remindersResponse,
      ] = await Promise.all([
        apiRequest<MemberResponseData>(`/members/${memberId}`),
        apiRequest<SubscriptionsResponseData>(
          `/subscriptions?memberId=${memberId}&limit=100`,
        ),
        apiRequest<MemberPaymentsResponseData>(`/payments/member/${memberId}`),
        apiRequest<MemberCheckInsResponseData>(`/check-ins/member/${memberId}`),
        apiRequest<MemberRemindersResponseData>(
          `/reminders/member/${memberId}`,
        ),
      ]);

      setMember(memberResponse.data?.member || null);
      setSubscriptions(subscriptionResponse.data?.subscriptions || []);
      setPayments(paymentsResponse.data?.payments || []);
      setCheckIns(checkInsResponse.data?.checkIns || []);
      setReminders(remindersResponse.data?.reminders || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load member profile.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMemberProfile();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMemberProfile]);

  const currentSubscription = useMemo(() => {
    return (
      subscriptions.find((subscription) => subscription.status === "active") ||
      subscriptions.find(
        (subscription) => subscription.status === "scheduled",
      ) ||
      subscriptions[0] ||
      null
    );
  }, [subscriptions]);

  const paidTotal = getPaymentTotal(payments);
  const successfulCheckIns = checkIns.filter((item) =>
    ["allowed", "warning"].includes(item.entryStatus),
  );
  const pendingReminders = reminders.filter(
    (reminder) => reminder.status === "pending",
  );

  const paymentHref = currentSubscription
    ? `/payments?memberId=${memberId}&subscriptionId=${currentSubscription._id}`
    : `/payments?memberId=${memberId}`;

  async function handleMemberStatusAction(
    action: "suspend" | "deactivate" | "reactivate",
  ) {
    setError("");
    setSuccessMessage("");
    setIsUpdatingStatus(true);

    try {
      const response = await apiRequest<MemberResponseData>(
        `/members/${memberId}/${action}`,
        {
          method: "PATCH",
        },
      );

      setSuccessMessage(response.message || `Member ${action} completed.`);

      await loadMemberProfile();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} member.`,
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleQuickCheckIn() {
    setError("");
    setSuccessMessage("");
    setQuickAction("checkin");

    try {
      const response = await apiRequest<CreateCheckInResponseData>(
        "/check-ins",
        {
          method: "POST",
          body: {
            memberId,
            notes: "Checked in from member profile quick action.",
          },
        },
      );

      const decisionMessage = response.data?.decision?.message;

      setSuccessMessage(
        decisionMessage || response.message || "Check-in recorded.",
      );

      await loadMemberProfile();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record check-in.",
      );
    } finally {
      setQuickAction("");
    }
  }

  async function handleGenerateReminder() {
    setError("");
    setSuccessMessage("");
    setQuickAction("reminder");

    try {
      const response = await apiRequest<GenerateRemindersResponseData>(
        "/reminders/generate",
        {
          method: "POST",
          body: {
            channel: "manual_whatsapp",
            expiringInDays: 3,
            includePaymentDue: true,
            includeExpired: true,
          },
        },
      );

      const createdCount = response.data?.createdCount || 0;
      const existingCount = response.data?.existingCount || 0;
      const skippedCount = response.data?.skippedCount || 0;

      setSuccessMessage(
        `Reminder queue updated. Created ${createdCount}, existing ${existingCount}, skipped ${skippedCount}.`,
      );

      await loadMemberProfile();
      setActiveTab("reminders");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate reminders.",
      );
    } finally {
      setQuickAction("");
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.7rem] bg-white/55 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Loading member profile...
      </div>
    );
  }

  if (error && !member) {
    return (
      <div className="rounded-[1.7rem] bg-red-50 p-8 text-[13px] text-red-700 shadow-sm ring-1 ring-red-200">
        {error}
      </div>
    );
  }

  if (!member) {
    return (
      <div className="rounded-[1.7rem] bg-white/55 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Member not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <MiniMetric
          label="Payments"
          value={formatMoney(paidTotal)}
          helper={`${payments.length} payment record(s)`}
        />

        <MiniMetric
          label="Check-ins"
          value={successfulCheckIns.length}
          helper={`${checkIns.length} total attempt(s)`}
        />

        <MiniMetric
          label="Subscriptions"
          value={subscriptions.length}
          helper={currentSubscription?.status || "No current subscription"}
        />

        <MiniMetric
          label="Reminders"
          value={pendingReminders.length}
          helper={`${reminders.length} total reminder(s)`}
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Member profile
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-[30px] font-medium tracking-[-0.05em] text-zinc-950">
                {getFullName(member)}
              </h2>

              <StatusPill status={member.status} />
            </div>

            <p className="mt-1 text-[13px] text-zinc-500">
              {member.memberCode} · {member.phone} ·{" "}
              {member.email || "No email"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/members"
              className="h-10 rounded-full bg-white px-5 py-2 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
            >
              Back
            </Link>

            <button
              onClick={loadMemberProfile}
              className="h-10 rounded-full bg-white px-5 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.7rem] bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
        <div className="mb-4">
          <h3 className="text-[16px] font-medium text-zinc-950">
            Quick actions
          </h3>
          <p className="mt-1 text-[13px] leading-6 text-zinc-500">
            Handle common tasks from this member profile without searching
            again.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href={`/subscriptions?memberId=${member._id}`}
            className="rounded-[1.4rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5 transition hover:bg-white hover:shadow-sm"
          >
            <p className="text-[22px]">↻</p>
            <h4 className="mt-3 text-[14px] font-medium text-zinc-950">
              Create subscription
            </h4>
            <p className="mt-1 text-[12px] leading-5 text-zinc-500">
              Assign this member to a gym plan.
            </p>
          </Link>

          <Link
            href={paymentHref}
            className="rounded-[1.4rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5 transition hover:bg-white hover:shadow-sm"
          >
            <p className="text-[22px]">R</p>
            <h4 className="mt-3 text-[14px] font-medium text-zinc-950">
              Record payment
            </h4>
            <p className="mt-1 text-[12px] leading-5 text-zinc-500">
              Take cash, EFT, card or partial payment.
            </p>
          </Link>

          <button
            onClick={handleQuickCheckIn}
            disabled={quickAction === "checkin"}
            className="rounded-[1.4rem] bg-[#e8ff5f] p-4 text-left ring-1 ring-black/5 transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-[22px]">⇥</p>
            <h4 className="mt-3 text-[14px] font-medium text-zinc-950">
              Check-in member
            </h4>
            <p className="mt-1 text-[12px] leading-5 text-zinc-700">
              {quickAction === "checkin"
                ? "Recording check-in..."
                : "Run entry decision and record attempt."}
            </p>
          </button>

          <button
            onClick={handleGenerateReminder}
            disabled={quickAction === "reminder"}
            className="rounded-[1.4rem] bg-[#f4f4f2] p-4 text-left ring-1 ring-black/5 transition hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-[22px]">✦</p>
            <h4 className="mt-3 text-[14px] font-medium text-zinc-950">
              Generate reminder
            </h4>
            <p className="mt-1 text-[12px] leading-5 text-zinc-500">
              {quickAction === "reminder"
                ? "Updating reminder queue..."
                : "Create reminder if member qualifies."}
            </p>
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.7rem] bg-red-50 p-4 text-[13px] text-red-700 shadow-sm ring-1 ring-red-200">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-[1.7rem] bg-emerald-50 p-4 text-[13px] text-emerald-700 shadow-sm ring-1 ring-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <SectionCard title="Profile details">
            <div className="space-y-3">
              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Phone</p>
                <p className="mt-1 text-[14px] font-medium text-zinc-950">
                  {member.phone}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Joined</p>
                <p className="mt-1 text-[14px] font-medium text-zinc-950">
                  {formatDate(member.joinedAt || member.createdAt)}
                </p>
              </div>

              <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                <p className="text-[12px] text-zinc-500">Emergency contact</p>
                <p className="mt-1 text-[14px] font-medium text-zinc-950">
                  {member.emergencyContact?.name || "Not captured"}
                </p>
                <p className="mt-1 text-[12px] text-zinc-500">
                  {member.emergencyContact?.phone || "No phone"}
                </p>
              </div>

              {member.notes ? (
                <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
                  <p className="text-[12px] text-zinc-500">Notes</p>
                  <p className="mt-2 text-[13px] leading-6 text-zinc-700">
                    {member.notes}
                  </p>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Status actions"
            helper="Use these only when the member profile needs to be blocked, paused or restored."
          >
            <div className="grid gap-2">
              {member.status !== "suspended" ? (
                <button
                  onClick={() => handleMemberStatusAction("suspend")}
                  disabled={isUpdatingStatus}
                  className="h-10 rounded-full bg-white px-4 text-[13px] font-medium text-amber-700 shadow-sm ring-1 ring-black/5 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Suspend member
                </button>
              ) : null}

              {member.status !== "inactive" ? (
                <button
                  onClick={() => handleMemberStatusAction("deactivate")}
                  disabled={isUpdatingStatus}
                  className="h-10 rounded-full bg-white px-4 text-[13px] font-medium text-red-600 shadow-sm ring-1 ring-black/5 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Deactivate member
                </button>
              ) : null}

              {member.status !== "active" ? (
                <button
                  onClick={() => handleMemberStatusAction("reactivate")}
                  disabled={isUpdatingStatus}
                  className="h-10 rounded-full bg-[#e8ff5f] px-4 text-[13px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/5 transition hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reactivate member
                </button>
              ) : null}
            </div>
          </SectionCard>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap gap-2">
              {[
                ["overview", "Overview"],
                ["payments", "Payments"],
                ["checkins", "Check-ins"],
                ["reminders", "Reminders"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    setActiveTab(
                      value as
                        | "overview"
                        | "payments"
                        | "checkins"
                        | "reminders",
                    )
                  }
                  className={`h-10 rounded-full px-5 text-[13px] transition ${
                    activeTab === value
                      ? "bg-[#e8ff5f] text-zinc-950 shadow-sm ring-1 ring-black/5"
                      : "bg-white/70 text-zinc-600 hover:bg-white hover:text-zinc-950"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === "overview" ? (
            <SectionCard title="Current subscription">
              {!currentSubscription ? (
                <EmptyState label="No subscription found for this member." />
              ) : (
                <div className="rounded-[1.4rem] bg-[#f4f4f2] p-5 ring-1 ring-black/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[20px] font-medium tracking-[-0.04em] text-zinc-950">
                        {currentSubscription.planSnapshot.name}
                      </h3>
                      <p className="mt-1 text-[13px] capitalize text-zinc-500">
                        {currentSubscription.planSnapshot.type} ·{" "}
                        {currentSubscription.planSnapshot.durationInDays} day(s)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusPill status={currentSubscription.status} />
                      <StatusPill status={currentSubscription.paymentStatus} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.2rem] bg-white/70 p-4 ring-1 ring-black/5">
                      <p className="text-[12px] text-zinc-500">Price</p>
                      <p className="mt-1 text-[17px] font-medium text-zinc-950">
                        {formatMoney(currentSubscription.planSnapshot.price)}
                      </p>
                    </div>

                    <div className="rounded-[1.2rem] bg-white/70 p-4 ring-1 ring-black/5">
                      <p className="text-[12px] text-zinc-500">Starts</p>
                      <p className="mt-1 text-[17px] font-medium text-zinc-950">
                        {formatDate(currentSubscription.startsAt)}
                      </p>
                    </div>

                    <div className="rounded-[1.2rem] bg-white/70 p-4 ring-1 ring-black/5">
                      <p className="text-[12px] text-zinc-500">Ends</p>
                      <p className="mt-1 text-[17px] font-medium text-zinc-950">
                        {formatDate(currentSubscription.endsAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          ) : null}

          {activeTab === "payments" ? (
            <SectionCard title="Payment history">
              {payments.length === 0 ? (
                <EmptyState label="No payments found for this member." />
              ) : (
                <div className="overflow-x-auto rounded-[1.4rem] bg-[#f4f4f2]">
                  <table className="min-w-[760px] border-collapse">
                    <thead>
                      <tr className="bg-[#dededb] text-left">
                        <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                          Receipt
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
                        <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={payment._id}
                          className="border-b border-black/10 last:border-0"
                        >
                          <td className="px-5 py-4 text-[13px] text-zinc-700">
                            {payment.receiptNumber}
                          </td>
                          <td className="px-5 py-4 text-[13px] font-medium text-zinc-950">
                            {formatMoney(payment.amount)}
                          </td>
                          <td className="px-5 py-4 text-[13px] capitalize text-zinc-700">
                            {payment.method?.replace("_", " ")}
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={payment.status} />
                          </td>
                          <td className="px-5 py-4 text-[13px] text-zinc-700">
                            {formatDateTime(
                              payment.paidAt || payment.createdAt,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          ) : null}

          {activeTab === "checkins" ? (
            <SectionCard title="Check-in history">
              {checkIns.length === 0 ? (
                <EmptyState label="No check-ins found for this member." />
              ) : (
                <div className="overflow-x-auto rounded-[1.4rem] bg-[#f4f4f2]">
                  <table className="min-w-[760px] border-collapse">
                    <thead>
                      <tr className="bg-[#dededb] text-left">
                        <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                          Time
                        </th>
                        <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                          Entry
                        </th>
                        <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                          Reason
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {checkIns.map((checkIn) => (
                        <tr
                          key={checkIn._id}
                          className="border-b border-black/10 last:border-0"
                        >
                          <td className="px-5 py-4 text-[13px] text-zinc-700">
                            {formatDateTime(checkIn.checkedInAt)}
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={checkIn.entryStatus} />
                          </td>
                          <td className="px-5 py-4 text-[13px] text-zinc-700">
                            {checkIn.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          ) : null}

          {activeTab === "reminders" ? (
            <SectionCard title="Reminder history">
              {reminders.length === 0 ? (
                <EmptyState label="No reminders found for this member." />
              ) : (
                <div className="space-y-3">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder._id}
                      className="rounded-[1.4rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-medium capitalize text-zinc-950">
                            {reminder.type?.replaceAll("_", " ")}
                          </p>
                          <p className="mt-1 text-[12px] text-zinc-500">
                            {formatDateTime(reminder.scheduledFor)}
                          </p>
                        </div>

                        <StatusPill status={reminder.status} />
                      </div>

                      <p className="mt-3 text-[13px] leading-6 text-zinc-700">
                        {reminder.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ) : null}
        </div>
      </section>
    </div>
);
}
