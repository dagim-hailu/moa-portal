import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="rounded-lg border border-destructive/30 bg-white p-6">
      <h2 className="text-xl font-semibold text-destructive">Access Denied</h2>
      <p className="mt-2 text-sm text-slate-600">You do not have permission to view this application.</p>
      <Link href="/" className="mt-3 inline-block text-emerald-700">Go to Dashboard</Link>
    </div>
  );
}
