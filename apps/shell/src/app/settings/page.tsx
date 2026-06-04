export default function SettingsPage() {
  return (
    <section className="max-w-xl space-y-4 rounded-lg border border-border bg-white p-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <label className="block text-sm">
        Full Name
        <input className="mt-1 w-full rounded border border-input px-3 py-2" defaultValue="Demo User" />
      </label>
      <label className="block text-sm">
        Email
        <input className="mt-1 w-full rounded border border-input px-3 py-2" defaultValue="demo@moa.gov.et" readOnly />
      </label>
      <label className="block text-sm">
        Language
        <select className="mt-1 w-full rounded border border-input px-3 py-2" defaultValue="en">
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
        </select>
      </label>
      <button className="rounded bg-emerald-700 px-3 py-2 text-white">Save Changes</button>
    </section>
  );
}
