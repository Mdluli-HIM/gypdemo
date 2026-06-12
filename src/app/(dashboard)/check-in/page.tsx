"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";
import { apiRequest } from "@/lib/api";
import type {
  CheckInLookupResponseData,
  CheckInRecord,
  CheckInSummaryResponseData,
  CreateCheckInResponseData,
  EntryStatus,
} from "@/lib/types";

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

function decisionStyle(status: EntryStatus) {
  if (status === "allowed") {
    return {
      shell: "bg-emerald-50 ring-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      button: "bg-emerald-500 text-white hover:bg-emerald-600",
    };
  }

  if (status === "warning") {
    return {
      shell: "bg-amber-50 ring-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
      button: "bg-amber-500 text-white hover:bg-amber-600",
    };
  }

  return {
    shell: "bg-red-50 ring-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    button: "bg-red-500 text-white hover:bg-red-600",
  };
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

function CheckInTable({ checkIns }: { checkIns: CheckInRecord[] }) {
  return (
    <div className="overflow-x-auto rounded-[1.4rem] bg-[#f4f4f2]">
      <table className="min-w-full border-collapse">
        <thead>
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
            <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
              Reason
            </th>
          </tr>
        </thead>

        <tbody>
          {checkIns.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-5 py-14 text-center text-[13px] text-zinc-500"
              >
                No check-ins recorded today.
              </td>
            </tr>
          ) : (
            checkIns.map((checkIn) => (
              <tr
                key={checkIn._id}
                className="border-b border-black/10 last:border-0"
              >
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

                <td className="px-5 py-4">
                  <StatusPill status={checkIn.entryStatus} />
                </td>

                <td className="max-w-[360px] px-5 py-4 text-[13px] text-zinc-600">
                  {checkIn.message}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<
    CheckInLookupResponseData["results"]
  >([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInRecord[]>([]);
  const [summary, setSummary] = useState<
    CheckInSummaryResponseData["today"] | null
  >(null);

  const [lookupError, setLookupError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const selectedResult = useMemo(() => {
    return lookupResults.find(
      (result) => result.member._id === selectedMemberId,
    );
  }, [lookupResults, selectedMemberId]);

  const selectedStyle = selectedResult
    ? decisionStyle(selectedResult.decision.entryStatus)
    : null;

  const loadCheckInData = useCallback(async () => {
    try {
      const [summaryResponse, todayResponse] = await Promise.all([
        apiRequest<CheckInSummaryResponseData>("/check-ins/summary"),
        apiRequest<{ date: string; checkIns: CheckInRecord[] }>(
          "/check-ins/today",
        ),
      ]);

      setSummary(summaryResponse.data?.today || null);
      setTodayCheckIns(todayResponse.data?.checkIns || []);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "Failed to load check-in data.",
      );
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCheckInData();
    }, 0);
  
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCheckInData]);
  

  async function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const cleanSearch = searchQuery.trim();

    if (!cleanSearch) {
      setLookupError(
        "Enter a member name, phone number, email, or member code.",
      );
      return;
    }

    setLookupError("");
    setActionMessage("");
    setIsSearching(true);

    try {
      const response = await apiRequest<CheckInLookupResponseData>(
        `/check-ins/lookup?search=${encodeURIComponent(cleanSearch)}`,
      );

      const results = response.data?.results || [];

      setLookupResults(results);
      setSelectedMemberId(results[0]?.member._id || "");

      if (results.length === 0) {
        setLookupError("No matching members found.");
      }
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "Failed to search member.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCreateCheckIn() {
    if (!selectedMemberId) {
      setLookupError("Select a member before recording check-in.");
      return;
    }

    setLookupError("");
    setActionMessage("");
    setIsCheckingIn(true);

    try {
      const response = await apiRequest<CreateCheckInResponseData>(
        "/check-ins",
        {
          method: "POST",
          body: {
            memberId: selectedMemberId,
            notes: "Checked in from admin reception screen.",
          },
        },
      );

      setActionMessage(response.message);

      await loadCheckInData();

      const refreshedLookup = searchQuery.trim();

      if (refreshedLookup) {
        const lookupResponse = await apiRequest<CheckInLookupResponseData>(
          `/check-ins/lookup?search=${encodeURIComponent(refreshedLookup)}`,
        );

        const results = lookupResponse.data?.results || [];

        setLookupResults(results);
        setSelectedMemberId(selectedMemberId);
      }
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "Failed to record check-in.",
      );
    } finally {
      setIsCheckingIn(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <MiniMetric
          label="Attempts today"
          value={summary?.totalAttempts || 0}
          helper="All allowed, warning and blocked attempts"
        />
        <MiniMetric
          label="Successful"
          value={summary?.successfulEntries || 0}
          helper={`${summary?.uniqueSuccessfulMembers || 0} unique member(s)`}
        />
        <MiniMetric
          label="Warnings"
          value={summary?.warningCount || 0}
          helper="Partial, grace period or duplicate check-ins"
        />
        <MiniMetric
          label="Blocked"
          value={summary?.blockedCount || 0}
          helper="Unpaid, expired, suspended or no subscription"
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Reception
            </p>
            <h2 className="mt-1 text-[28px] font-medium tracking-[-0.04em] text-zinc-950">
              Check-in Control
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              Search a member, review the decision, then record the check-in.
            </p>
          </div>

          <button
            onClick={loadCheckInData}
            className="h-10 rounded-full bg-white px-5 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <form
            onSubmit={handleSearch}
            className="rounded-[1.7rem] bg-white/60 p-3 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex gap-2">
              <label className="relative h-11 flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500">
                  ⌕
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search member code, name or phone..."
                  className="h-full w-full rounded-2xl border-0 bg-white pl-9 pr-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]"
                />
              </label>

              <button
                type="submit"
                disabled={isSearching}
                className="h-11 rounded-2xl bg-[#e8ff5f] px-5 text-[13px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/5 transition hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {lookupError ? (
            <div className="rounded-[1.7rem] bg-red-50 p-4 text-[13px] text-red-700 shadow-sm ring-1 ring-red-200">
              {lookupError}
            </div>
          ) : null}

          {actionMessage ? (
            <div className="rounded-[1.7rem] bg-emerald-50 p-4 text-[13px] text-emerald-700 shadow-sm ring-1 ring-emerald-200">
              {actionMessage}
            </div>
          ) : null}

          <div className="rounded-[1.7rem] bg-white/60 p-3 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-[13px] font-medium text-zinc-950">
                Search results
              </p>
              <p className="text-[12px] text-zinc-500">
                {lookupResults.length} found
              </p>
            </div>

            <div className="space-y-2">
              {lookupResults.length === 0 ? (
                <div className="rounded-[1.3rem] bg-[#f4f4f2] p-5 text-center text-[13px] text-zinc-500">
                  Search for a member to start check-in.
                </div>
              ) : (
                lookupResults.map((result) => {
                  const style = decisionStyle(result.decision.entryStatus);
                  const isSelected = selectedMemberId === result.member._id;

                  return (
                    <button
                      key={result.member._id}
                      onClick={() => setSelectedMemberId(result.member._id)}
                      className={`w-full rounded-[1.3rem] p-4 text-left transition ${
                        isSelected
                          ? "bg-[#e8ff5f] ring-1 ring-black/10"
                          : "bg-[#f4f4f2] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-medium text-zinc-950">
                            {getMemberName(result.member)}
                          </p>
                          <p className="mt-1 text-[12px] text-zinc-500">
                            {result.member.memberCode} · {result.member.phone}
                          </p>
                        </div>

                        <span
                          className={`inline-flex h-7 items-center gap-2 rounded-full bg-white px-3 text-[12px] font-medium capitalize ring-1 ring-black/5 ${style.text}`}
                        >
                          <span
                            className={`size-2 rounded-full ${style.dot}`}
                          />
                          {result.decision.entryStatus}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-zinc-600">
                        {result.decision.message}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.7rem] bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
            {!selectedResult || !selectedStyle ? (
              <div className="grid min-h-[260px] place-items-center rounded-[1.4rem] bg-[#f4f4f2] p-8 text-center">
                <div>
                  <p className="text-[32px]">⇥</p>
                  <h3 className="mt-3 text-[20px] font-medium tracking-[-0.04em] text-zinc-950">
                    No member selected
                  </h3>
                  <p className="mt-2 max-w-md text-[13px] leading-6 text-zinc-500">
                    Search for a member and select a result to see their entry
                    decision.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-[1.4rem] p-5 ring-1 ${selectedStyle.shell}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      Entry decision
                    </p>
                    <h3 className="mt-2 text-[32px] font-medium capitalize tracking-[-0.05em] text-zinc-950">
                      {selectedResult.decision.entryStatus}
                    </h3>
                    <p
                      className={`mt-2 max-w-2xl text-[14px] leading-6 ${selectedStyle.text}`}
                    >
                      {selectedResult.decision.message}
                    </p>
                  </div>

                  <span className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium capitalize shadow-sm ring-1 ring-black/5">
                    <span
                      className={`size-2 rounded-full ${selectedStyle.dot}`}
                    />
                    {selectedResult.decision.decisionCode.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.2rem] bg-white/70 p-4 ring-1 ring-black/5">
                    <p className="text-[12px] text-zinc-500">Member</p>
                    <p className="mt-2 text-[15px] font-medium text-zinc-950">
                      {getMemberName(selectedResult.member)}
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-500">
                      {selectedResult.member.memberCode}
                    </p>
                  </div>

                  <div className="rounded-[1.2rem] bg-white/70 p-4 ring-1 ring-black/5">
                    <p className="text-[12px] text-zinc-500">Phone</p>
                    <p className="mt-2 text-[15px] font-medium text-zinc-950">
                      {selectedResult.member.phone}
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-500">
                      {selectedResult.member.status}
                    </p>
                  </div>

                  <div className="rounded-[1.2rem] bg-white/70 p-4 ring-1 ring-black/5">
                    <p className="text-[12px] text-zinc-500">Balance due</p>
                    <p className="mt-2 text-[15px] font-medium text-zinc-950">
                      R{selectedResult.decision.paymentSummary?.balanceDue || 0}
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-500">
                      {selectedResult.decision.alreadyCheckedInToday
                        ? "Already checked in today"
                        : "No duplicate found"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCreateCheckIn}
                  disabled={isCheckingIn}
                  className={`mt-6 h-12 w-full rounded-full text-[13px] font-medium shadow-sm ring-1 ring-black/5 transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${selectedStyle.button}`}
                >
                  {isCheckingIn
                    ? "Recording check-in..."
                    : selectedResult.decision.entryStatus === "blocked"
                      ? "Record blocked attempt"
                      : "Record check-in"}
                </button>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[1.7rem] bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[13px] font-medium text-zinc-950">
                Today’s check-ins
              </p>
              <p className="text-[12px] text-zinc-500">
                {isLoadingSummary
                  ? "Loading..."
                  : `${todayCheckIns.length} records`}
              </p>
            </div>

            <CheckInTable checkIns={todayCheckIns} />
          </section>
        </div>
      </section>
    </div>
  );
}
