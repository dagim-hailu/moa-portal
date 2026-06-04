"use client";

export default function GlobalError() {
  return (
    <html>
      <body>
        <div className="p-6">
          <h2 className="text-xl font-semibold">Unexpected Error</h2>
          <p className="text-sm text-slate-600">The shell recovered. Please reload the page.</p>
        </div>
      </body>
    </html>
  );
}
