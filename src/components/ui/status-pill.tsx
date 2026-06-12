type StatusPillProps = {
  status: string;
};

export function StatusPill({ status }: StatusPillProps) {
  const normalizedStatus = status.toLowerCase();

  const className =
    normalizedStatus === "active" ||
    normalizedStatus === "paid" ||
    normalizedStatus === "allowed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : normalizedStatus === "suspended" ||
          normalizedStatus === "warning" ||
          normalizedStatus === "partial" ||
          normalizedStatus === "pending"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-red-50 text-red-700 ring-red-100";

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-medium capitalize ring-1 ${className}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
