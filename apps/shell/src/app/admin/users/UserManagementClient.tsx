"use client";

import { useState } from "react";
import { Users as UsersIcon, Edit, Power, Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserManagementClient({ 
  initialUsers, 
  availableApps 
}: { 
  initialUsers: any[]; 
  availableApps: any[];
}) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  async function handleAssign(userId: string, appSlug: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "assign", userId, slug: appSlug }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      router.refresh();
      // Update selectedUser locally to reflect changes
      if (selectedUser?.id === userId) {
        setSelectedUser({
          ...selectedUser,
          apps: [...selectedUser.apps, appSlug]
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRevoke(userId: string, appSlug: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "revoke", userId, slug: appSlug }),
      });
      if (!res.ok) throw new Error("Failed to revoke");
      router.refresh();
      // Update selectedUser locally
      if (selectedUser?.id === userId) {
        setSelectedUser({
          ...selectedUser,
          apps: selectedUser.apps.filter((s: string) => s !== appSlug)
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredUsers = initialUsers.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage portal users and application access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="border-b border-slate-100 p-4">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Apps</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className={`hover:bg-slate-50 ${selectedUser?.id === user.id ? 'bg-slate-50 ring-1 ring-inset ring-slate-200' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A7554] text-white font-medium text-sm">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.fullName || "User"}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {user.roles.map((role: string) => (
                          <span key={role} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.apps.length} apps
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-primary hover:text-primary/80 transition"
                      >
                        Manage Access
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details / Assignment Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[500px]">
          {selectedUser ? (
            <>
              <div className="border-b border-slate-100 p-6">
                <h2 className="text-lg font-semibold text-slate-900">{selectedUser.fullName || selectedUser.email.split('@')[0]}</h2>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Application Access</h3>
                <ul className="space-y-3">
                  {availableApps.map(app => {
                    const hasAccess = selectedUser.apps.includes(app.slug);
                    return (
                      <li key={app.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{app.nameEn}</p>
                          <p className="text-xs text-slate-500">/{app.slug}</p>
                        </div>
                        <button
                          onClick={() => hasAccess ? handleRevoke(selectedUser.id, app.slug) : handleAssign(selectedUser.id, app.slug)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${hasAccess ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                          title={hasAccess ? "Revoke Access" : "Grant Access"}
                        >
                          {hasAccess ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </button>
                      </li>
                    );
                  })}
                  {availableApps.length === 0 && (
                    <p className="text-sm text-slate-500 text-center">No apps available.</p>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <UsersIcon className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No User Selected</h3>
              <p className="text-sm text-slate-500 mt-1">Select a user from the list to manage their application access.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
