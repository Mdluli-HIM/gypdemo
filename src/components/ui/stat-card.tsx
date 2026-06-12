type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
        {value}
      </div>
      {helper ? <p className="mt-3 text-sm text-zinc-500">{helper}</p> : null}
    </div>
  );
}
