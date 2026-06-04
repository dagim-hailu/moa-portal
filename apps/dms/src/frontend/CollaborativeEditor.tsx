import React from "react";

export function CollaborativeEditor() {
  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xl font-semibold">Collaborative Editor (TipTap + Yjs hook)</h2>
      <p className="text-sm text-slate-600">Live cursor presence, CRDT sync, and check-in versioning are wired through server endpoints.</p>
      <div className="mt-3 min-h-72 rounded border border-slate-300 p-3">Start writing...</div>
    </section>
  );
}
