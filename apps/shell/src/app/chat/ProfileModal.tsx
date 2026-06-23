"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber?: string | null;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
  groupsCount: number;
  departments: Array<{ id: string; slug: string; nameEn: string; nameAm: string }>;
  canEditDepartments?: boolean;
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
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "media">("info");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [allDepartments, setAllDepartments] = useState<Array<{ id: string; slug: string; nameEn: string; nameAm: string }>>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setSelectedDeptIds(profile.departments?.map(d => d.id) || []);
    }
  }, [profile]);

  useEffect(() => {
    if (isEditing && allDepartments.length === 0) {
      (async () => {
        try {
          const res = await fetch("/api/chat/departments");
          if (res.ok) {
            const data = await res.json();
            setAllDepartments(data);
          }
        } catch {}
      })();
    }
  }, [isEditing, allDepartments.length]);

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

  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${serverUrl}${url}`;
  };

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
          setEditUsername(data.username || "");
          setEditPhone(data.phoneNumber || "");
        } else {
          setError("User not found");
        }
      } catch { setError("Failed to load profile"); }
    })();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let success = true;

      if (isOwnProfile) {
        if (!editName.trim()) {
          setSaving(false);
          return;
        }
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
          body: JSON.stringify({
            fullName: editName.trim(),
            username: editUsername.trim() || undefined,
            phoneNumber: editPhone.trim() || null,
            avatarUrl,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          const newAvatarUrl = updated.avatarUrl ?? avatarUrl;
          const newFullName = updated.fullName || editName.trim();
          setProfile(prev => prev ? {
            ...prev,
            fullName: newFullName,
            avatarUrl: newAvatarUrl,
            username: updated.username || editUsername.trim(),
            phoneNumber: (updated.phoneNumber ?? editPhone.trim()) || null,
          } : prev);
          onProfileUpdated?.(newAvatarUrl, newFullName);
        } else {
          success = false;
          alert("Failed to update profile details");
        }
      }

      if (profile?.canEditDepartments && success) {
        const res = await fetch(`/api/chat/users/${userId}/departments`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ departmentIds: selectedDeptIds }),
        });
        if (res.ok) {
          const profileRes = await fetch(`/api/chat/profile/${userId}`);
          if (profileRes.ok) {
            const updatedProfile = await profileRes.json();
            setProfile(updatedProfile);
          }
        } else {
          success = false;
          alert("Failed to update departments");
        }
      }

      if (success) {
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch {
      alert("An error occurred while saving profile");
    }
    setSaving(false);
  };

  const getAvatarUrl = (p: UserProfile) => {
    if (avatarPreview) return avatarPreview;
    if (p.avatarUrl) return getMediaUrl(p.avatarUrl);
    return `https://i.pravatar.cc/200?u=${p.id}`;
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setEditName(profile.fullName || "");
      setEditUsername(profile.username || "");
      setEditPhone(profile.phoneNumber || "");
      setSelectedDeptIds(profile.departments?.map(d => d.id) || []);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const roleColor =
    profile?.role === "admin" ? "bg-purple-100 text-purple-700" :
    profile?.role === "supervisor" ? "bg-blue-100 text-blue-700" :
    "bg-[var(--primary-light)] text-[var(--primary-green)]";

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[9000] bg-black/90 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl" onClick={() => setLightboxUrl(null)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div className="fixed inset-0 z-[5000] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div
          className="bg-[var(--sidebar-bg)] w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3 rounded-t-2xl">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)] transition">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <h2 className="text-lg font-bold text-[var(--text-main)] flex-1">
              {isOwnProfile ? "My Profile" : "User Info"}
            </h2>
            {(isOwnProfile || profile?.canEditDepartments) && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-sm text-[var(--primary-green)] font-semibold hover:underline flex items-center gap-1">
                <i className="fa-solid fa-pen-to-square"></i> Edit
              </button>
            )}
            {(isOwnProfile || profile?.canEditDepartments) && isEditing && (
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="text-sm text-[var(--text-muted)] font-semibold hover:text-[var(--text-main)]">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="text-sm bg-[var(--primary-green)] text-white px-3 py-1 rounded-lg font-semibold hover:bg-[#154735] transition disabled:opacity-50">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {error ? (
              <div className="text-center text-red-500 py-8 px-6">{error}</div>
            ) : !profile ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Banner + Avatar */}
                <div className="relative">
                  <div className="h-24 bg-gradient-to-r from-[var(--primary-green)] to-emerald-400"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <div className="relative group">
                      <img
                        src={getAvatarUrl(profile)}
                        alt={profile.fullName}
                        className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-[var(--sidebar-bg)]"
                      />
                      {isEditing && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                          <i className="fa-solid fa-camera text-xl"></i>
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                      )}
                      <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[var(--sidebar-bg)] ${
                        profile.role === "admin" ? "bg-purple-500" : profile.role === "supervisor" ? "bg-blue-500" : "bg-[var(--primary-green)]"
                      }`}></div>
                    </div>
                  </div>
                </div>

                {/* Name & Role */}
                <div className="pt-14 pb-4 px-6 text-center">
                  {isEditing ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="text-center text-xl font-bold text-[var(--text-main)] bg-[var(--bg-main)] rounded-lg px-3 py-1.5 border border-[var(--border-color)] outline-none w-full max-w-[260px] focus:border-[var(--primary-green)]"
                      placeholder="Full name"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-[var(--text-main)]">{profile.fullName}</h2>
                  )}
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">@{profile.username}</p>
                  <span className={`mt-2 inline-block px-3 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide ${roleColor}`}>
                    {profile.role}
                  </span>
                </div>

                {/* Action buttons (for other users) */}
                {!isOwnProfile && (
                  <div className="flex gap-2 px-6 pb-5">
                    <button onClick={() => onStartChat(profile.id)}
                      className="flex-1 py-2.5 bg-[var(--primary-green)] text-white rounded-xl font-bold text-sm hover:bg-[#154735] transition flex items-center justify-center gap-2 shadow-sm">
                      <i className="fa-solid fa-comment"></i> Message
                    </button>
                    {profile.phoneNumber && (
                      <a href={`tel:${profile.phoneNumber}`}
                        className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-main)] transition">
                        <i className="fa-solid fa-phone"></i>
                      </a>
                    )}
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-color)] px-6">
                  {(["info", "media"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-sm font-semibold transition capitalize ${activeTab === tab ? "border-b-2 border-[var(--primary-green)] text-[var(--primary-green)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
                      {tab === "info" ? "Info" : `Media (${profile.sharedMedia.length})`}
                    </button>
                  ))}
                </div>

                {/* Info Tab */}
                {activeTab === "info" && (
                  <div className="px-6 py-4 flex flex-col gap-3">
                    {/* Email (read-only) */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <i className="fa-solid fa-envelope text-[var(--text-muted)] w-5 text-center"></i>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-main)] font-medium text-sm truncate">{profile.email}</p>
                        <p className="text-xs text-[var(--text-muted)]">Email</p>
                      </div>
                    </div>

                    {/* Username */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <i className="fa-solid fa-at text-[var(--text-muted)] w-5 text-center"></i>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input value={editUsername} onChange={e => setEditUsername(e.target.value)}
                            className="w-full bg-transparent outline-none text-sm font-medium text-[var(--text-main)] border-b border-[var(--border-color)] focus:border-[var(--primary-green)] pb-0.5"
                            placeholder="username" />
                        ) : (
                          <p className="text-[var(--text-main)] font-medium text-sm">@{profile.username}</p>
                        )}
                        <p className="text-xs text-[var(--text-muted)]">Username</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <i className="fa-solid fa-phone text-[var(--text-muted)] w-5 text-center"></i>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                            className="w-full bg-transparent outline-none text-sm font-medium text-[var(--text-main)] border-b border-[var(--border-color)] focus:border-[var(--primary-green)] pb-0.5"
                            placeholder="+1 555 000 0000" />
                        ) : (
                          <p className="text-[var(--text-main)] font-medium text-sm">
                            {profile.phoneNumber || <span className="text-[var(--text-muted)] italic">Not set</span>}
                          </p>
                        )}
                        <p className="text-xs text-[var(--text-muted)]">Phone</p>
                      </div>
                    </div>

                    {/* Groups count */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <i className="fa-solid fa-users text-[var(--text-muted)] w-5 text-center"></i>
                      <div className="flex-1">
                        <p className="text-[var(--text-main)] font-medium text-sm">{profile.groupsCount} group{profile.groupsCount !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-[var(--text-muted)]">Groups in Common</p>
                      </div>
                    </div>

                    {/* Departments */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-sitemap text-[var(--text-muted)] w-5 text-center"></i>
                        <span className="text-xs text-[var(--text-muted)]">Departments</span>
                      </div>
                      <div className="mt-1 pl-8">
                        {isEditing && profile.canEditDepartments ? (
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                            {allDepartments.map((dept) => {
                              const checked = selectedDeptIds.includes(dept.id);
                              return (
                                <label key={dept.id} className="flex items-center gap-2 text-sm text-[var(--text-main)] cursor-pointer hover:text-[var(--primary-green)] transition">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedDeptIds((prev) => [...prev, dept.id]);
                                      } else {
                                        setSelectedDeptIds((prev) => prev.filter((id) => id !== dept.id));
                                      }
                                    }}
                                    className="rounded border-[var(--border-color)] text-[var(--primary-green)] focus:ring-[var(--primary-green)] w-4 h-4 cursor-pointer"
                                  />
                                  <span>{dept.nameEn}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.departments && profile.departments.length > 0 ? (
                              profile.departments.map((dept) => (
                                <span key={dept.id} className="px-2 py-1 rounded bg-[var(--primary-light)] text-[var(--primary-green)] text-xs font-semibold">
                                  {dept.nameEn}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[var(--text-muted)] italic">No department assigned</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Joined */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <i className="fa-solid fa-calendar text-[var(--text-muted)] w-5 text-center"></i>
                      <div className="flex-1">
                        <p className="text-[var(--text-main)] font-medium text-sm">{new Date(profile.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
                        <p className="text-xs text-[var(--text-muted)]">Member Since</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === "media" && (
                  <div className="px-6 py-4">
                    {profile.sharedMedia.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)] gap-3">
                        <i className="fa-regular fa-image text-4xl opacity-40"></i>
                        <p className="text-sm">No shared media yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {profile.sharedMedia.map((media) => (
                          <div key={media.id}
                            className="aspect-square bg-[var(--bg-main)] rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition border border-[var(--border-color)] relative group">
                            {media.fileType === "image" ? (
                              <>
                                <img src={getMediaUrl(media.fileUrl)} alt="" className="w-full h-full object-cover" onClick={() => setLightboxUrl(getMediaUrl(media.fileUrl))} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                  <i className="fa-solid fa-expand text-white opacity-0 group-hover:opacity-100 transition text-lg drop-shadow"></i>
                                </div>
                              </>
                            ) : media.fileType === "video" ? (
                              <>
                                <video src={getMediaUrl(media.fileUrl)} className="w-full h-full object-cover" preload="metadata" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                  <i className="fa-solid fa-play text-white text-xl drop-shadow"></i>
                                </div>
                                <a href={getMediaUrl(media.fileUrl)} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
                              </>
                            ) : media.messageType === "voice" ? (
                              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--primary-green)] bg-[var(--primary-light)] gap-1">
                                <i className="fa-solid fa-microphone text-2xl"></i>
                                <span className="text-[0.6rem] font-semibold">Voice</span>
                              </div>
                            ) : (
                              <a href={getMediaUrl(media.fileUrl)} target="_blank" rel="noopener noreferrer"
                                className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-1 hover:bg-[var(--bg-main)]">
                                <i className="fa-solid fa-file text-2xl"></i>
                                <span className="text-[0.6rem] truncate px-1 w-full text-center">{media.content}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
