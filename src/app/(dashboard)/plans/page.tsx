"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";
import { apiRequest } from "@/lib/api";
import type {
  CreateMembershipPlanPayload,
  CreateMembershipPlanResponseData,
  MembershipPlan,
  MembershipPlansResponseData,
  MembershipPlanType,
} from "@/lib/types";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value || 0);
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

function getPlanTypeLabel(type: string) {
  return type.replace("_", " ");
}

function getDefaultDuration(type: MembershipPlanType) {
  if (type === "daily") return "1";
  if (type === "weekly") return "7";
  if (type === "monthly") return "30";
  return "";
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

function PlansTable({
  plans,
  onToggleActive,
}: {
  plans: MembershipPlan[];
  onToggleActive: (plan: MembershipPlan) => void;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-[1.4rem] bg-[#f4f4f2]">
      <table className="min-w-[1040px] border-collapse">
        <thead>
          <tr className="bg-[#dededb] text-left">
            <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
              Plan
            </th>
            <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
              Type
            </th>
            <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
              Price
            </th>
            <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
              Duration
            </th>
            <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
              Status
            </th>
            <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
              Created
            </th>
            <th className="px-5 py-4 text-right text-[12px] font-medium text-zinc-600">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {plans.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-5 py-14 text-center text-[13px] text-zinc-500"
              >
                No membership plans found.
              </td>
            </tr>
          ) : (
            plans.map((plan) => (
              <tr
                key={plan._id}
                className="border-b border-black/10 last:border-0"
              >
                <td className="px-5 py-4">
                  <p className="text-[13px] font-medium text-zinc-950">
                    {plan.name}
                  </p>
                  <p className="mt-1 max-w-[360px] truncate text-[12px] text-zinc-500">
                    {plan.description || "No description"}
                  </p>
                </td>

                <td className="px-5 py-4 text-[13px] capitalize text-zinc-700">
                  {getPlanTypeLabel(plan.type)}
                </td>

                <td className="px-5 py-4 text-[13px] font-medium text-zinc-950">
                  {formatMoney(plan.price)}
                </td>

                <td className="px-5 py-4 text-[13px] text-zinc-700">
                  {plan.durationInDays} day(s)
                </td>

                <td className="px-5 py-4">
                  <StatusPill status={plan.isActive ? "active" : "inactive"} />
                </td>

                <td className="px-5 py-4 text-[13px] text-zinc-700">
                  {formatDate(plan.createdAt)}
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onToggleActive(plan)}
                    className={`h-9 rounded-full px-4 text-[12px] font-medium shadow-sm ring-1 ring-black/5 transition ${
                      plan.isActive
                        ? "bg-white text-zinc-700 hover:bg-red-50 hover:text-red-700"
                        : "bg-[#e8ff5f] text-zinc-950 hover:scale-[0.98]"
                    }`}
                  >
                    {plan.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MembershipPlanType>(
    "all",
  );
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [name, setName] = useState("");
  const [type, setType] = useState<MembershipPlanType>("monthly");
  const [price, setPrice] = useState("");
  const [durationInDays, setDurationInDays] = useState("30");
  const [description, setDescription] = useState("");
  const [benefitsInput, setBenefitsInput] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionPlanId, setActionPlanId] = useState("");

  const loadPlans = useCallback(async () => {
    try {
      const response = await apiRequest<MembershipPlansResponseData>(
        "/membership-plans?limit=100",
      );

      setPlans(response.data?.plans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlans();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPlans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const searchable = [
        plan.name,
        plan.type,
        plan.price,
        plan.durationInDays,
        plan.description,
        plan.benefits?.join(" "),
        plan.isActive ? "active" : "inactive",
      ].join(" ");

      const matchesSearch = normalizeText(searchable).includes(
        normalizeText(searchQuery),
      );

      const matchesType = typeFilter === "all" || plan.type === typeFilter;

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && plan.isActive) ||
        (activeFilter === "inactive" && !plan.isActive);

      return matchesSearch && matchesType && matchesActive;
    });
  }, [plans, searchQuery, typeFilter, activeFilter]);

  const activePlans = plans.filter((plan) => plan.isActive);
  const inactivePlans = plans.filter((plan) => !plan.isActive);
  const monthlyPlans = plans.filter((plan) => plan.type === "monthly");

  function resetForm() {
    setName("");
    setType("monthly");
    setPrice("");
    setDurationInDays("30");
    setDescription("");
    setBenefitsInput("");
    setDisplayOrder("");
  }

  function handleTypeChange(nextType: MembershipPlanType) {
    setType(nextType);

    const nextDuration = getDefaultDuration(nextType);

    if (nextDuration) {
      setDurationInDays(nextDuration);
    }
  }

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const numericPrice = Number(price);
    const numericDuration = Number(durationInDays);
    const numericDisplayOrder = displayOrder ? Number(displayOrder) : undefined;

    if (!name.trim()) {
      setError("Plan name is required.");
      return;
    }

    if (!numericPrice || numericPrice < 0) {
      setError("Enter a valid plan price.");
      return;
    }

    if (!numericDuration || numericDuration < 1) {
      setError("Duration must be at least 1 day.");
      return;
    }

    setIsSubmitting(true);

    try {
      const benefits = benefitsInput
        .split(",")
        .map((benefit) => benefit.trim())
        .filter(Boolean);

      const payload: CreateMembershipPlanPayload = {
        name,
        type,
        price: numericPrice,
        durationInDays: numericDuration,
        description: description || undefined,
        benefits,
        displayOrder: numericDisplayOrder,
      };

      const response = await apiRequest<CreateMembershipPlanResponseData>(
        "/membership-plans",
        {
          method: "POST",
          body: payload,
        },
      );

      setSuccessMessage(response.message || "Membership plan created.");

      resetForm();

      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(plan: MembershipPlan) {
    setError("");
    setSuccessMessage("");
    setActionPlanId(plan._id);

    const endpoint = plan.isActive
      ? `/membership-plans/${plan._id}/deactivate`
      : `/membership-plans/${plan._id}/reactivate`;

    try {
      await apiRequest<{ plan: MembershipPlan }>(endpoint, {
        method: "PATCH",
      });

      setSuccessMessage(
        plan.isActive
          ? `${plan.name} has been deactivated.`
          : `${plan.name} has been reactivated.`,
      );

      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan.");
    } finally {
      setActionPlanId("");
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.7rem] bg-white/55 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Loading membership plans...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <MiniMetric
          label="Total plans"
          value={plans.length}
          helper="All created packages"
        />
        <MiniMetric
          label="Active"
          value={activePlans.length}
          helper="Available for new subscriptions"
        />
        <MiniMetric
          label="Inactive"
          value={inactivePlans.length}
          helper="Hidden from new subscriptions"
        />
        <MiniMetric
          label="Monthly"
          value={monthlyPlans.length}
          helper="Recurring monthly offers"
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Pricing
            </p>
            <h2 className="mt-1 text-[28px] font-medium tracking-[-0.04em] text-zinc-950">
              Membership Plans
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              Manage daily, weekly, monthly and custom packages for the gym.
            </p>
          </div>

          <button
            onClick={loadPlans}
            className="h-10 rounded-full bg-white px-5 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">
        <form
          onSubmit={handleCreatePlan}
          className="space-y-4 rounded-[1.7rem] bg-white/60 p-4 shadow-sm ring-1 ring-black/5"
        >
          <div>
            <h3 className="text-[16px] font-medium text-zinc-950">
              Create plan
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Add a package that staff can assign to members.
            </p>
          </div>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Plan name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
              placeholder="Monthly Membership"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-[12px] font-medium text-zinc-600">
                Type
              </span>
              <select
                value={type}
                onChange={(event) =>
                  handleTypeChange(event.target.value as MembershipPlanType)
                }
                className={selectClass}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-[12px] font-medium text-zinc-600">
                Price
              </span>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className={inputClass}
                placeholder="350"
                inputMode="decimal"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-[12px] font-medium text-zinc-600">
                Duration in days
              </span>
              <input
                value={durationInDays}
                onChange={(event) => setDurationInDays(event.target.value)}
                className={inputClass}
                placeholder="30"
                inputMode="numeric"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-[12px] font-medium text-zinc-600">
                Display order optional
              </span>
              <input
                value={displayOrder}
                onChange={(event) => setDisplayOrder(event.target.value)}
                className={inputClass}
                placeholder="1"
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Description optional
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={textareaClass}
              placeholder="Standard monthly gym access."
            />
          </label>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-zinc-600">
              Benefits optional
            </span>
            <input
              value={benefitsInput}
              onChange={(event) => setBenefitsInput(event.target.value)}
              className={inputClass}
              placeholder="Full gym access, Renewal reminders, Student discount"
            />
            <p className="text-[12px] text-zinc-500">
              Separate benefits with commas.
            </p>
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
            {isSubmitting ? "Creating plan..." : "Create plan"}
          </button>
        </form>

        <div className="min-w-0 space-y-4">
          <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="relative h-10 w-[320px] max-w-full">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500">
                  ⌕
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, type, description..."
                  className="h-full w-full rounded-2xl border-0 bg-white pl-9 pr-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as "all" | MembershipPlanType,
                    )
                  }
                  className="h-10 appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-[#e8ff5f]"
                >
                  <option value="all">All types</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>

                <select
                  value={activeFilter}
                  onChange={(event) =>
                    setActiveFilter(
                      event.target.value as "all" | "active" | "inactive",
                    )
                  }
                  className="h-10 appearance-none rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-[#e8ff5f]"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.7rem] bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[13px] font-medium text-zinc-950">
                Plan records
              </p>
              <p className="text-[12px] text-zinc-500">
                {filteredPlans.length} record(s)
              </p>
            </div>

            <PlansTable
              plans={filteredPlans}
              onToggleActive={handleToggleActive}
            />

            {actionPlanId ? (
              <p className="mt-3 px-2 text-[12px] text-zinc-500">
                Updating selected plan...
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}
