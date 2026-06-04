import Link from "next/link";
import type { JwtPayload } from "@moa/shared/auth";
import { getAllowedNav } from "../../lib/rbac";

type Props = {
  session: JwtPayload;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuFreeShell({ session, title, description, children }: Props) {
  const nav = getAllowedNav(session);
  const displayName = session.fullName ?? session.username;

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row">
        <aside className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:w-72 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">AU Free</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{displayName}</h1>
          <p className="mt-1 text-sm text-slate-500">{session.email}</p>
          <div className="mt-5 space-y-2">
            <NavLink href="/au-free">Overview</NavLink>
            <NavLink href="/au-free/account">Account</NavLink>
            {nav.users && <NavLink href="/au-free/users">Users</NavLink>}
            {nav.starter && <NavLink href="/au-free/starter">Starter</NavLink>}
            {nav.admin && <NavLink href="/au-free/admin">Admin</NavLink>}
          </div>
        </aside>

        <section className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Protected Workspace</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
          </div>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
    >
      {children}
    </Link>
  );
}

export function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}
