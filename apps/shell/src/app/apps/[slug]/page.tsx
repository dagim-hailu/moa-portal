import { notFound } from "next/navigation";
import { DocumentLibrary, CollaborativeEditor } from "@moa/dms";
import { getSession } from "../../../lib/session";
import { AppErrorBoundary } from "../../../components/AppErrorBoundary";

export default async function DynamicAppPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) {
    notFound();
  }

  if (!session.apps.includes(params.slug)) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-white p-6">
        <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
        <p className="text-sm text-slate-600">You do not have permission to access this application.</p>
      </div>
    );
  }

  if (params.slug !== "dms") {
    notFound();
  }

  return (
    <AppErrorBoundary>
      <div className="space-y-4">
        <DocumentLibrary />
        <CollaborativeEditor />
      </div>
    </AppErrorBoundary>
  );
}
