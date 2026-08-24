const colors: Record<string, string> = {
  upcoming:    "bg-blue-100 text-blue-700",
  completed:   "bg-green-100 text-green-700",
  cancelled:   "bg-red-100 text-red-700",
  pending:     "bg-yellow-100 text-yellow-700",
  Pending:     "bg-yellow-100 text-yellow-700",
  Submitted:   "bg-green-100 text-green-700",
  Completed:   "bg-green-100 text-green-700",
  online:      "bg-purple-100 text-purple-700",
  "in-person": "bg-orange-100 text-orange-700",
};

export default function Badge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}
