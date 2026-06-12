import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f4f1ea] lg:grid-cols-[1fr_520px]">
      <section className="hidden min-h-screen flex-col justify-between bg-zinc-950 p-10 text-white lg:flex">
        <div>
          <div className="text-xs uppercase tracking-[0.4em] text-zinc-500">
            GymFlow
          </div>
          <h1 className="mt-10 max-w-2xl text-6xl font-semibold leading-[0.95] tracking-tight">
            Manage members, payments and gym access from one dashboard.
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="text-3xl font-semibold">01</div>
            <p className="mt-3 text-sm text-zinc-400">Register members</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="text-3xl font-semibold">02</div>
            <p className="mt-3 text-sm text-zinc-400">Track payments</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="text-3xl font-semibold">03</div>
            <p className="mt-3 text-sm text-zinc-400">Control check-ins</p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center p-5">
        <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
              Sign in to GymFlow
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Use your owner/admin account from the API setup sprint.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
