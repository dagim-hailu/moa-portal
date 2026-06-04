import React from "react";

export function DocumentLibrary() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Document Management</h1>
        <div className="flex gap-2">
          <button className="rounded bg-emerald-700 px-3 py-2 text-white">+ New</button>
          <button className="rounded border border-slate-300 px-3 py-2">Upload</button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-3 rounded border border-slate-200 bg-white p-3">Folder Tree</aside>
        <div className="col-span-9 rounded border border-slate-200 bg-white p-3">Document List</div>
      </div>
    </section>
  );
}
