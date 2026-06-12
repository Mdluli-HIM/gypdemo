"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";
import { apiRequest } from "@/lib/api";

type SubscriptionStatus =
  | "scheduled"
  | "active"
  | "expired"
  | "cancelled"
  | "suspended";

type SubscriptionPaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

type MemberOption = {
  _id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: string;
};

type PlanOption = {
  _id: string;
  name: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  price: number;
  durationInDays: number;
  description?: string;
  benefits?: string[];
  isActive: boolean;
};

type GymSubscription = {
  _id: string;
  member: MemberOption;
  plan: PlanOption;
  planSnapshot: {
    name: string;
    type: string;
    price: number;
    durationInDays: number;
  };
  startsAt: string;
  endsAt: string;
  status: SubscriptionStatus;
  paymentStatus: SubscriptionPaymentStatus;
  gracePeriodDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type MembersResponseData = {
  members: MemberOption[];
};

type PlansResponseData = {
  plans: PlanOption[];
};

type SubscriptionsResponseData = {
  subscriptions: GymSubscription[];
};

type CreateSubscriptionResponseData = {
  subscription: GymSubscription;
};

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

function normalizeText(value: unknown) {
  return String(value || "").toLowerCase();
}

function formatDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toIsoDateTime(dateValue: string) {
  if (!dateValue) return undefined;

  return new Date(`${dateValue}T00:00:00.000`).toISOString();
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
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

const textareaClass =
  "min-h-24 w-full resize-none rounded-2xl border-0 bg-white px-4 py-3 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]";

  function SubscriptionsTable({
    subscriptions,
    onAction,
    actionId,
  }: {
    subscriptions: GymSubscription[];
    onAction: (
      subscription: GymSubscription,
      action: "renew" | "cancel" | "suspend" | "reactivate",
    ) => void;
    actionId: string;
  }) {
    const [openMenuId, setOpenMenuId] = useState("");
  
    function handleAction(
      subscription: GymSubscription,
      action: "renew" | "cancel" | "suspend" | "reactivate",
    ) {
      setOpenMenuId("");
      onAction(subscription, action);
    }
  
    return (
      <div className="w-full overflow-x-auto rounded-[1.4rem] bg-[#f4f4f2]">
        <table className="min-w-[980px] border-collapse">
          <thead>
            <tr className="bg-[#dededb] text-left">
              <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                Member
              </th>
              <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                Plan
              </th>
              <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                Price
              </th>
              <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                Period
              </th>
              <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                Status
              </th>
              <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                Payment
              </th>
              <th className="w-[120px] px-5 py-4 text-right text-[12px] font-medium text-zinc-600">
                Actions
              </th>
            </tr>
          </thead>
  
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-14 text-center text-[13px] text-zinc-500"
                >
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              subscriptions.map((subscription) => {
                const isOpen = openMenuId === subscription._id;
                const isBusy = actionId === subscription._id || Boolean(actionId);
  
                return (
                  <tr
                    key={subscription._id}
                    className="border-b border-black/10 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-medium text-zinc-950">
                        {getMemberName(subscription.member)}
                      </p>
                      <p className="mt-1 text-[12px] text-zinc-500">
                        {subscription.member?.memberCode || "—"} ·{" "}
                        {subscription.member?.phone || "No phone"}
                      </p>
                    </td>
  
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-medium text-zinc-950">
                        {subscription.planSnapshot?.name || "Unknown plan"}
                      </p>
                      <p className="mt-1 text-[12px] capitalize text-zinc-500">
                        {subscription.planSnapshot?.type || "—"} ·{" "}
                        {subscription.planSnapshot?.durationInDays || 0} day(s)
                      </p>
                    </td>
  
                    <td className="px-5 py-4 text-[13px] font-medium text-zinc-950">
                      {formatMoney(subscription.planSnapshot?.price || 0)}
                    </td>
  
                    <td className="px-5 py-4 text-[13px] text-zinc-700">
                      <div className="leading-5">
                        <p>{formatDate(subscription.startsAt)}</p>
                        <p className="text-[12px] text-zinc-500">
                          to {formatDate(subscription.endsAt)}
                        </p>
                      </div>
                    </td>
  
                    <td className="px-5 py-4">
                      <StatusPill status={subscription.status} />
                    </td>
  
                    <td className="px-5 py-4">
                      <StatusPill status={subscription.paymentStatus} />
                    </td>
  
                    <td className="relative px-5 py-4 text-right align-middle">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current === subscription._id ? "" : subscription._id,
                          )
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-[12px] font-medium text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Manage
                        <span className="text-[10px]">▾</span>
                      </button>
  
                      {isOpen ? (
                        <div className="absolute right-5 top-[48px] z-30 w-44 overflow-hidden rounded-2xl bg-white p-1.5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.16)] ring-1 ring-black/10">
                          <button
                            type="button"
                            onClick={() => handleAction(subscription, "renew")}
                            className="flex h-9 w-full items-center justify-between rounded-xl px-3 text-[12px] font-medium text-zinc-800 transition hover:bg-[#e8ff5f]"
                          >
                            Renew
                            <span>↻</span>
                          </button>
  
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(
                                subscription,
                                subscription.status === "suspended"
                                  ? "reactivate"
                                  : "suspend",
                              )
                            }
                            className="flex h-9 w-full items-center justify-between rounded-xl px-3 text-[12px] font-medium text-zinc-800 transition hover:bg-amber-50 hover:text-amber-700"
                          >
                            {subscription.status === "suspended"
                              ? "Reactivate"
                              : "Suspend"}
                            <span>⏸</span>
                          </button>
  
                          {subscription.status !== "cancelled" ? (
                            <button
                              type="button"
                              onClick={() => handleAction(subscription, "cancel")}
                              className="flex h-9 w-full items-center justify-between rounded-xl px-3 text-[12px] font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Cancel
                              <span>×</span>
                            </button>
                          ) : (
                            <div className="flex h-9 w-full items-center justify-between rounded-xl px-3 text-[12px] font-medium text-zinc-400">
                              Cancelled
                              <span>✓</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<GymSubscription[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);

  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startsAt, setStartsAt] = useState(getTodayDateInputValue());
  const [paymentStatus, setPaymentStatus] =
    useState<SubscriptionPaymentStatus>("unpaid");
  const [gracePeriodDays, setGracePeriodDays] = useState("0");
  const [notes, setNotes] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubscriptionStatus>(
    "all",
  );
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | SubscriptionPaymentStatus
  >("all");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");

  const loadSubscriptionData = useCallback(async () => {
    try {
      const [subscriptionsResponse, membersResponse, plansResponse] =
        await Promise.all([
          apiRequest<SubscriptionsResponseData>("/subscriptions?limit=100"),
          apiRequest<MembersResponseData>("/members?status=active&limit=100"),
          apiRequest<PlansResponseData>("/membership-plans/active"),
        ]);

      setSubscriptions(subscriptionsResponse.data?.subscriptions || []);
      setMembers(membersResponse.data?.members || []);
      setPlans(plansResponse.data?.plans || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load subscription data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubscriptionData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadSubscriptionData]);

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan._id === planId);
  }, [plans, planId]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const searchable = [
        getMemberName(subscription.member),
        subscription.member?.memberCode,
        subscription.member?.phone,
        subscription.planSnapshot?.name,
        subscription.planSnapshot?.type,
        subscription.status,
        subscription.paymentStatus,
      ].join(" ");

      const matchesSearch = normalizeText(searchable).includes(
        normalizeText(searchQuery),
      );

      const matchesStatus =
        statusFilter === "all" || subscription.status === statusFilter;

      const matchesPayment =
        paymentFilter === "all" || subscription.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [subscriptions, searchQuery, statusFilter, paymentFilter]);

  const activeCount = subscriptions.filter(
    (subscription) => subscription.status === "active",
  ).length;

  const expiredCount = subscriptions.filter(
    (subscription) => subscription.status === "expired",
  ).length;

  const unpaidCount = subscriptions.filter(
    (subscription) => subscription.paymentStatus === "unpaid",
  ).length;

  const partialCount = subscriptions.filter(
    (subscription) => subscription.paymentStatus === "partial",
  ).length;

  function resetForm() {
    setMemberId("");
    setPlanId("");
    setStartsAt(getTodayDateInputValue());
    setPaymentStatus("unpaid");
    setGracePeriodDays("0");
    setNotes("");
  }

  async function handleCreateSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!memberId) {
      setError("Select a member.");
      return;
    }

    if (!planId) {
      setError("Select a membership plan.");
      return;
    }

    const graceDays = Number(gracePeriodDays);

    if (Number.isNaN(graceDays) || graceDays < 0) {
      setError("Grace period must be 0 or more.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<CreateSubscriptionResponseData>(
        "/subscriptions",
        {
          method: "POST",
          body: {
            memberId,
            planId,
            startsAt: toIsoDateTime(startsAt),
            paymentStatus,
            gracePeriodDays: graceDays,
            notes: notes || undefined,
          },
        },
      );

      setSuccessMessage(response.message || "Subscription created.");

      resetForm();

      await loadSubscriptionData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create subscription.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubscriptionAction(
    subscription: GymSubscription,
    action: "renew" | "cancel" | "suspend" | "reactivate",
  ) {
    setError("");
    setSuccessMessage("");
    setActionId(subscription._id);

    const endpoint =
      action === "renew"
        ? `/subscriptions/${subscription._id}/renew`
        : `/subscriptions/${subscription._id}/${action}`;

    const body =
      action === "renew"
        ? {
            paymentStatus: "unpaid",
            gracePeriodDays: subscription.gracePeriodDays || 0,
            notes: "Renewed from admin subscriptions page.",
          }
        : undefined;

    try {
      const response = await apiRequest<CreateSubscriptionResponseData>(
        endpoint,
        {
          method: "PATCH",
          body,
        },
      );

      setSuccessMessage(
        response.message || `Subscription ${action} completed.`,
      );

      await loadSubscriptionData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} subscription.`,
      );
    } finally {
      setActionId("");
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.7rem] bg-white/55 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Loading subscriptions...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <MiniMetric
          label="Active"
          value={activeCount}
          helper="Current active memberships"
        />
        <MiniMetric
          label="Expired"
          value={expiredCount}
          helper="Needs renewal"
        />
        <MiniMetric
          label="Unpaid"
          value={unpaidCount}
          helper="Blocked at check-in"
        />
        <MiniMetric
          label="Partial"
          value={partialCount}
          helper="Allowed with warning"
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Memberships
            </p>
            <h2 className="mt-1 text-[28px] font-medium tracking-[-0.04em] text-zinc-950">
              Member Subscriptions
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              Connect members to daily, weekly, monthly and custom gym plans.
            </p>
          </div>

          <button
            onClick={loadSubscriptionData}
            className="h-10 rounded-full bg-white px-5 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[430px_1fr]">
        <form
          onSubmit={handleCreateSubscription}
          className="space-y-4 rounded-[1.7rem] bg-white/60 p-4 shadow-sm ring-1 ring-black/5"
        >
          <div>
            <h3 className="text-[16px] font-medium text-zinc-950">
              Create subscription
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Assign an active plan to an active member.
            </p>
          </div>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Member
            </span>
            <select
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              className={selectClass}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {getMemberName(member)} · {member.memberCode} · {member.phone}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Plan
            </span>
            <select
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
              className={selectClass}
            >
              <option value="">Select plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} · {formatMoney(plan.price)} ·{" "}
                  {plan.durationInDays} days
                </option>
              ))}
            </select>
          </label>

          {selectedPlan ? (
            <div className="rounded-[1.3rem] bg-[#f4f4f2] p-4 ring-1 ring-black/5">
              <p className="text-[13px] font-medium text-zinc-950">
                {selectedPlan.name}
              </p>
              <p className="mt-1 text-[12px] capitalize text-zinc-500">
                {selectedPlan.type} · {selectedPlan.durationInDays} day(s)
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[12px] text-zinc-500">Price</p>
                  <p className="mt-1 text-[16px] font-medium text-zinc-950">
                    {formatMoney(selectedPlan.price)}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-zinc-500">Initial payment</p>
                  <p className="mt-1 text-[16px] font-medium capitalize text-zinc-950">
                    {paymentStatus}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-[12px] font-medium text-zinc-600">
                Start date
              </span>
              <input
                type="date"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-[12px] font-medium text-zinc-600">
                Grace period days
              </span>
              <input
                value={gracePeriodDays}
                onChange={(event) => setGracePeriodDays(event.target.value)}
                className={inputClass}
                placeholder="0"
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Payment status
            </span>
            <select
              value={paymentStatus}
              onChange={(event) =>
                setPaymentStatus(
                  event.target.value as SubscriptionPaymentStatus,
                )
              }
              className={selectClass}
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Notes optional
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={textareaClass}
              placeholder="Opening special, student plan, renewal note, etc."
            />
          </label>

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
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-full bg-[#e8ff5f] text-[13px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/5 transition hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating subscription..." : "Create subscription"}
          </button>
        </form>

        <div className="space-y-4">
          <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="relative h-10 w-[320px] max-w-full">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500">
                  ⌕
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search member, phone, plan..."
                  className="h-full w-full rounded-2xl border-0 bg-white pl-9 pr-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | SubscriptionStatus,
                    )
                  }
                  className="h-10 appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-[#e8ff5f]"
                >
                  <option value="all">All statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(event) =>
                    setPaymentFilter(
                      event.target.value as "all" | SubscriptionPaymentStatus,
                    )
                  }
                  className="h-10 appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-[#e8ff5f]"
                >
                  <option value="all">All payments</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.7rem] bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[13px] font-medium text-zinc-950">
                Subscription records
              </p>
              <p className="text-[12px] text-zinc-500">
                {filteredSubscriptions.length} record(s)
              </p>
            </div>

            <SubscriptionsTable
              subscriptions={filteredSubscriptions}
              onAction={handleSubscriptionAction}
              actionId={actionId}
            />

            {actionId ? (
              <p className="mt-3 px-2 text-[12px] text-zinc-500">
                Updating selected subscription...
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}
