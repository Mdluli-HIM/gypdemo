"use client";

import { FormEvent, useState } from "react";

import { useAuth } from "@/context/auth-context";

export function LoginForm() {
  const { login } = useAuth();

  const [email, setEmail] = useState("marcus@gymflow.com");
  const [password, setPassword] = useState("Password123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email,
        password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-800">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-900"
          placeholder="admin@gymflow.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-800">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-900"
          placeholder="Enter password"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-2xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
