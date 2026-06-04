"use client";

import Link from "next/link";
import { FileText, LayoutGrid, X } from "lucide-react";
import type { MyApp } from "../../lib/portal-queries";

const ICONS: Record<string, React.ReactNode> = {
  dms: <FileText className="h-8 w-8 text-primary" />,
};

function appIcon(slug: string) {
  return ICONS[slug] ?? <LayoutGrid className="h-8 w-8 text-primary" />;
}

type Props = {
  open: boolean;
  onClose: () => void;
  apps: MyApp[];
  locale?: "en" | "am";
};

export function AppMegaMenu({ open, onClose, apps, locale = "en" }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-[85vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-border bg-[var(--portal-card)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--portal-bg-secondary)] text-gray-700 hover:bg-destructive hover:text-white"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid flex-[1.6] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-5 overflow-y-auto bg-[var(--portal-bg)] p-8 md:p-10">
          {apps.length === 0 ? (
            <p className="col-span-full text-muted">
              No applications assigned. Contact your administrator.
            </p>
          ) : (
            apps.map((app) => (
              <Link
                key={app.id}
                href={app.routePath || '#!'}
                onClick={onClose}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-[var(--portal-card)] p-5 text-center transition hover:-translate-y-1 hover:border-primary hover:shadow-sm"
              >
                {appIcon(app.slug)}
                <span className="text-caption font-bold uppercase tracking-wide text-gray-900">
                  {locale === "am" ? app.nameAm : app.nameEn}
                </span>
              </Link>
            ))
          )}
        </div>

        <aside className="hidden w-full max-w-sm flex-col gap-6 border-l border-border bg-[var(--portal-bg-secondary)] p-8 md:flex">
          <p className="text-small font-extrabold uppercase tracking-widest text-primary">Digital Hub</p>
          <h3 className="text-h2 text-gray-900">
            Let&apos;s make it <br />
            <span className="text-primary">Sustainable.</span>
          </h3>
          <p className="text-small text-muted">
            Select a module from the grid to access your assigned ministry applications.
          </p>
          <div className="portal-card p-6">
            <p className="font-bold text-gray-900">Module Information</p>
            <p className="mt-2 text-caption text-muted">
              Only applications assigned to your account are shown here.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
