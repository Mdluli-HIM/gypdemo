"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";

type MemberStatus = "active" | "inactive" | "suspended";

type Member = {
  _id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: MemberStatus;
  joinedAt?: string;
  createdAt?: string;
};

type MembersResponseData = {
  members: Member[];
};

function getFullName(member: Member) {
  return `${member.firstName} ${member.lastName}`.trim();
}

function formatDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeText(value: unknown) {
  return String(value || "").toLowerCase();
}

function StatusPill({ status }: { status: MemberStatus }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    suspended: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-medium capitalize ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatBox({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-[2.2rem] bg-white/55 px-5 py-4 shadow-sm ring-1 ring-black/5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-medium tracking-[-0.04em] text-zinc-950">
        {value}
      </p>
      <p className="mt-1 text-[12px] text-zinc-500">{helper}</p>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MemberStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      try {
        const response =
          await apiRequest<MembersResponseData>("/members?limit=100");

        if (ignore) return;

        setMembers(response.data?.members || []);
      } catch (err) {
        if (ignore) return;

        setError(
          err instanceof Error ? err.message : "Failed to load members.",
        );
      } finally {
        if (ignore) return;

        setIsLoading(false);
      }
    }

    loadMembers();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const searchable = [
        member.memberCode,
        member.firstName,
        member.lastName,
        member.phone,
        member.email,
        member.status,
      ].join(" ");

      const matchesSearch = normalizeText(searchable).includes(
        normalizeText(searchQuery),
      );

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const activeCount = members.filter(
    (member) => member.status === "active",
  ).length;
  const inactiveCount = members.filter(
    (member) => member.status === "inactive",
  ).length;
  const suspendedCount = members.filter(
    (member) => member.status === "suspended",
  ).length;

  if (isLoading) {
    return (
      <div className="rounded-[1.7rem] bg-white/60 p-8 text-[13px] text-zinc-500 shadow-sm ring-1 ring-black/5">
        Loading members...
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

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-4">
        <StatBox
          label="Total"
          value={members.length}
          helper="All member profiles"
        />
        <StatBox label="Active" value={activeCount} helper="Can use the gym" />
        <StatBox
          label="Inactive"
          value={inactiveCount}
          helper="No longer active"
        />
        <StatBox
          label="Suspended"
          value={suspendedCount}
          helper="Needs attention"
        />
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="px-2">
            <h2 className="text-[26px] font-medium tracking-[-0.04em] text-zinc-950">
              Members
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              Search and manage gym member profiles.
            </p>
          </div>

          <Link
            href="/members/new"
            className="grid h-11 place-items-center rounded-full bg-[#e8ff5f] px-5 text-[13px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/5 transition hover:scale-[0.98]"
          >
            Add New Member +
          </Link>
        </div>
      </section>

      <section className="rounded-[1.7rem] bg-white/55 p-3 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="relative h-10 w-[360px] max-w-full">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500">
              ⌕
            </span>

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search name, phone, email or member code..."
              className="h-full w-full rounded-2xl border-0 bg-white pl-9 pr-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]"
            />
          </label>

          <label className="relative h-10">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | MemberStatus)
              }
              className="h-full appearance-none rounded-2xl border-0 bg-white py-0 pl-4 pr-10 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-[#e8ff5f]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">
              ▾
            </span>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.7rem] bg-white/70 p-3 shadow-sm ring-1 ring-black/5">
        <div className="overflow-x-auto rounded-[1.4rem] bg-[#f4f4f2]">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#dededb] text-left">
                <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                  Member ID
                </th>
                <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                  Name
                </th>
                <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                  Phone
                </th>
                <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                  Email
                </th>
                <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                  Joined
                </th>
                <th className="px-5 py-4 text-[12px] font-medium text-zinc-600">
                  Status
                </th>
                <th className="px-5 py-4" />
              </tr>
            </thead>

            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-[13px] text-zinc-500"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member._id}
                    className="border-b border-black/10 last:border-0"
                  >
                    <td className="px-5 py-4 text-[13px] text-zinc-700">
                      {member.memberCode}
                    </td>

                    <td className="px-5 py-4 text-[13px] font-medium text-zinc-950">
                      {getFullName(member)}
                    </td>

                    <td className="px-5 py-4 text-[13px] text-zinc-700">
                      {member.phone}
                    </td>

                    <td className="px-5 py-4 text-[13px] text-zinc-700">
                      {member.email || "—"}
                    </td>

                    <td className="px-5 py-4 text-[13px] text-zinc-700">
                      {formatDate(member.joinedAt || member.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusPill status={member.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/members/${member._id}`}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-[12px] font-medium text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
