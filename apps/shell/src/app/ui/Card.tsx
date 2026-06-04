import { ReactNode } from "react";

export function Card({ title, value, icon, colorClass = "bg-emerald-100 text-emerald-700" }: { title: string; value: string, icon: ReactNode, colorClass?: string }) {
  return (
    <article className="flex items-center gap-5 rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
      </div>
    </article>
  );
}
