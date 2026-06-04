import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <h2 className="text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-600">The application or route is inactive or missing.</p>
      <Link href="/" className="mt-3 inline-block text-emerald-700">Go to Dashboard</Link>
    </div>
  );
}
