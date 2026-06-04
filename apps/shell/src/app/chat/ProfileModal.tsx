"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
  groupsCount: number;
  sharedMedia: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    messageType: string;
    content: string;
    createdAt: string;
  }>;
}

interface ProfileModalProps {
  userId: string;
  onClose: () => void;
  onStartChat: (userId: string) => void;
  currentUserId?: string | null;
  onProfileUpdated?: (avatarUrl: string | null | undefined, fullName: string) => void;
}

export function ProfileModal({ userId, onClose, onStartChat, currentUserId, onProfileUpdated }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const serverUrl = typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SERVER_URL === ""
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:4000`
    : "http://localhost:4000";

  const isOwnProfile = currentUserId != null && userId === currentUserId;

  useEffect(() => {
    if (!userId || userId === "undefined" || userId === "null") {
      setError("Please login to view profile");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/chat/profile/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.error) { setError(data.error); return; }
          setProfile(data);
          setEditName(data.fullName || "");
        } else {
          setError("User not found");
        }
      } catch { setError("Failed to load profile"); }
    })();
  }, [userId]);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      let avatarUrl = profile?.avatarUrl;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        const uploadRes = await fetch("/api/chat/upload", { method: "POST", body: fd });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          avatarUrl = data.fileUrl;
        }
      }

      const res = await fetch("/api/chat/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: editName.trim(), avatarUrl }),
      });
      if (res.ok) {
        const updated = await res.json();
        const newAvatarUrl = updated.avatarUrl ?? avatarUrl;
        const newFullName = updated.fullName || editName.trim();
        setProfile(prev => prev ? { ...prev, fullName: newFullName, avatarUrl: newAvatarUrl } : prev);
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        onProfileUpdated?.(newAvatarUrl, newFullName);
      } else {
        alert("Failed to update profile");
      }
    } catch { alert("Failed to update profile"); }
    setSaving(false);
  };

  const getAvatarUrl = (p: UserProfile) => {
    if (avatarPreview) return avatarPreview;
    if (p.avatarUrl) return `${serverUrl}${p.avatarUrl}`;
    return `https://i.pravatar.cc/200?u=${p.id}`;
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-[var(--sidebar-bg)] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-4 rounded-t-2xl">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)] transition">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
          <h2 className="text-lg font-bold text-[var(--text-main)]">{isOwnProfile ? "My Profile" : "User Info"}</h2>
          {isOwnProfile && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="ml-auto text-sm text-[var(--primary-green)] font-semibold hover:underline">
              <i className="fa-solid fa-pen-to-square mr-1"></i>Edit
            </button>
          )}
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : !profile ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Avatar & Name */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4 group">
                  <img
                    src={getAvatarUrl(profile)}
                    alt={profile.fullName}
                    className="w-28 h-28 rounded-full object-cover shadow-md border-2 border-[var(--bg-main)]"
                  />
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      <i className="fa-solid fa-camera text-xl"></i>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  )}
                  <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[var(--sidebar-bg)] ${profile.role === "admin" ? "bg-purple-500" : profile.role === "supervisor" ? "bg-blue-500" : "bg-[var(--primary-green)]"}`}></div>
                </div>
                {isEditing ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="text-center text-xl font-bold text-[var(--text-main)] bg-[var(--bg-main)] rounded-lg px-3 py-1 border border-[var(--border-color)] outline-none w-full max-w-[250px]"
                      placeholder="Full name"
                    />
                    <div className="flex gap-2 mt-1">
                      <button onClick={handleSave} disabled={saving}
                        className="px-4 py-1.5 bg-[var(--primary-green)] text-white rounded-lg text-sm font-semibold hover:bg-[#154735] transition disabled:opacity-50">
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={() => { setIsEditing(false); setEditName(profile.fullName || ""); setAvatarPreview(null); setAvatarFile(null); }}
                        className="px-4 py-1.5 border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm font-semibold hover:bg-[var(--bg-main)] transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-[var(--text-main)]">{profile.fullName}</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">@{profile.username}</p>
                    <span className="mt-2 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide bg-[var(--primary-light)] text-[var(--primary-green)]">{profile.role}</span>
                  </>
                )}
              </div>

              {/* Actions */}
              {!isOwnProfile && (
                <div className="flex gap-2 mb-6">
                  <button onClick={() => onStartChat(profile.id)}
                    className="flex-1 py-2.5 bg-[var(--primary-green)] text-white rounded-xl font-bold text-sm hover:bg-[#154735] transition flex items-center justify-center gap-2 shadow-sm">
                    <i className="fa-solid fa-comment"></i> Message
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-main)] transition">
                    <i className="fa-solid fa-phone"></i>
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-main)] transition">
                    <i className="fa-solid fa-ellipsis"></i>
                  </button>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-3">
                  <i className="fa-solid fa-envelope text-[var(--text-muted)] w-5 text-center"></i>
                  <div className="flex-1">
                    <p className="text-[var(--text-main)] font-medium text-sm">{profile.email}</p>
                    <p className="text-xs text-[var(--text-muted)]">Email</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-3">
                  <i className="fa-solid fa-user text-[var(--text-muted)] w-5 text-center"></i>
                  <div className="flex-1">
                    <p className="text-[var(--text-main)] font-medium text-sm">@{profile.username}</p>
                    <p className="text-xs text-[var(--text-muted)]">Username</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-3">
                  <i className="fa-solid fa-users text-[var(--text-muted)] w-5 text-center"></i>
                  <div className="flex-1">
                    <p className="text-[var(--text-main)] font-medium text-sm">{profile.groupsCount} groups</p>
                    <p className="text-xs text-[var(--text-muted)]">Groups in Common</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <i className="fa-solid fa-calendar text-[var(--text-muted)] w-5 text-center"></i>
                  <div className="flex-1">
                    <p className="text-[var(--text-main)] font-medium text-sm">{new Date(profile.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-[var(--text-muted)]">Joined</p>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 px-1">Shared Media</h3>
                {profile.sharedMedia.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm text-center py-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">No shared media</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {profile.sharedMedia.map((media) => (
                      <div key={media.id} className="aspect-square bg-[var(--bg-main)] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition border border-[var(--border-color)]">
                        {media.fileType === "image" ? (
                          <img src={`${serverUrl}${media.fileUrl}`} alt="" className="w-full h-full object-cover" />
                        ) : media.messageType === "voice" ? (
                          <div className="w-full h-full flex items-center justify-center text-[var(--primary-green)] bg-[var(--primary-light)]">
                            <i className="fa-solid fa-microphone text-xl"></i>
                          </div>
                        ) : (
                          <a href={`${serverUrl}${media.fileUrl}`} target="_blank" className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                            <i className="fa-solid fa-file text-xl"></i>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
