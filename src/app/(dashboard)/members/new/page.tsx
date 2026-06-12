"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";

type CreateMemberResponseData = {
  member: {
    _id: string;
    memberCode: string;
  };
};

const inputClass =
  "h-11 w-full rounded-2xl border-0 bg-white px-4 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]";

const textareaClass =
  "min-h-28 w-full resize-none rounded-2xl border-0 bg-white px-4 py-3 text-[13px] text-zinc-800 shadow-sm ring-1 ring-black/5 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e8ff5f]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[12px] font-medium text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function NewMemberPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    gender: "prefer_not_to_say",
    dateOfBirth: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    street: "",
    suburb: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : undefined,
        emergencyContact: {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relationship: form.emergencyRelationship,
        },
        address: {
          street: form.street,
          suburb: form.suburb,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode,
        },
        notes: form.notes,
      };

      const response = await apiRequest<CreateMemberResponseData>("/members", {
        method: "POST",
        body: payload,
      });

      if (!response.data?.member) {
        throw new Error("Member was created, but response is missing member.");
      }

      router.push("/members");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.7rem] bg-white/55 p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Members
            </p>
            <h2 className="mt-1 text-[28px] font-medium tracking-[-0.04em] text-zinc-950">
              Add new member
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              Create a member profile for payments, subscriptions and check-ins.
            </p>
          </div>

          <Link
            href="/members"
            className="grid h-10 place-items-center rounded-full bg-white px-5 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-950 hover:text-white"
          >
            Back to members
          </Link>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 xl:grid-cols-[1fr_360px]"
      >
        <section className="space-y-4 rounded-[1.7rem] bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
          <div className="rounded-[1.4rem] bg-[#f4f4f2] p-4">
            <h3 className="text-[15px] font-medium text-zinc-950">
              Personal details
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="First name">
                <input
                  required
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Thabo"
                />
              </Field>

              <Field label="Last name">
                <input
                  required
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Nkosi"
                />
              </Field>

              <Field label="Phone">
                <input
                  required
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className={inputClass}
                  placeholder="0711111111"
                />
              </Field>

              <Field label="Email optional">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={inputClass}
                  placeholder="member@example.com"
                />
              </Field>

              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(event) =>
                    updateField("gender", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Date of birth optional">
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    updateField("dateOfBirth", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-[1.4rem] bg-[#f4f4f2] p-4">
            <h3 className="text-[15px] font-medium text-zinc-950">
              Emergency contact
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Name">
                <input
                  value={form.emergencyName}
                  onChange={(event) =>
                    updateField("emergencyName", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Lerato Nkosi"
                />
              </Field>

              <Field label="Phone">
                <input
                  value={form.emergencyPhone}
                  onChange={(event) =>
                    updateField("emergencyPhone", event.target.value)
                  }
                  className={inputClass}
                  placeholder="0722222222"
                />
              </Field>

              <Field label="Relationship">
                <input
                  value={form.emergencyRelationship}
                  onChange={(event) =>
                    updateField("emergencyRelationship", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Sister"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-[1.4rem] bg-[#f4f4f2] p-4">
            <h3 className="text-[15px] font-medium text-zinc-950">
              Address optional
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Street">
                <input
                  value={form.street}
                  onChange={(event) =>
                    updateField("street", event.target.value)
                  }
                  className={inputClass}
                  placeholder="12 Main Road"
                />
              </Field>

              <Field label="Suburb">
                <input
                  value={form.suburb}
                  onChange={(event) =>
                    updateField("suburb", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Bedfordview"
                />
              </Field>

              <Field label="City">
                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  className={inputClass}
                  placeholder="Johannesburg"
                />
              </Field>

              <Field label="Province">
                <input
                  value={form.province}
                  onChange={(event) =>
                    updateField("province", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Gauteng"
                />
              </Field>

              <Field label="Postal code">
                <input
                  value={form.postalCode}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
                  className={inputClass}
                  placeholder="2007"
                />
              </Field>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[1.7rem] bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[15px] font-medium text-zinc-950">Notes</h3>

            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className={`${textareaClass} mt-4`}
              placeholder="Opening special, student discount, medical notes, etc."
            />
          </div>

          {error ? (
            <div className="rounded-[1.7rem] bg-red-50 p-4 text-[13px] text-red-700 shadow-sm ring-1 ring-red-200">
              {error}
            </div>
          ) : null}

          <div className="rounded-[1.7rem] bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-full bg-[#e8ff5f] text-[13px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/5 transition hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating member..." : "Create member"}
            </button>

            <p className="mt-3 text-center text-[12px] leading-5 text-zinc-500">
              The API automatically generates the member code.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}