"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
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

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const serverUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : "http://localhost:4000";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/chat/profile/${params.userId}`);
        if (res.ok) setProfile(await res.json());
        else setError("User not found");
      } catch { setError("Failed to load profile"); }
    })();
  }, [params.userId]);

  const startChat = () => {
    if (!profile) return;
    router.push(`/chat?open=${profile.id}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-[var(--primary-green)] text-white rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] font-['Plus_Jakarta_Sans',sans-serif]">
      <style jsx global>{`
        :root { --primary-green: #1A7554; --primary-light: #eaf6ee; --bg-main: #f8fafc; --sidebar-bg: #ffffff; --text-main: #1e293b; --text-muted: #64748b; --border-color: #e2e8f0; }
        [data-theme="dark"] { --bg-main: #0f172a; --sidebar-bg: #1e293b; --text-main: #f8fafc; --text-muted: #94a3b8; --border-color: #334155; --primary-light: rgba(26,117,84,0.1); }
      `}</style>

      {/* Header */}
      <div className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)]">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h1 className="text-xl font-bold text-[var(--text-main)]">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Avatar & Name — Telegram style */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <img
              src={`https://i.pravatar.cc/200?u=${profile.id}`}
              alt={profile.fullName}
              className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-[var(--sidebar-bg)]"
            />
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-[var(--sidebar-bg)] ${profile.role === "admin" ? "bg-purple-500" : profile.role === "supervisor" ? "bg-blue-500" : "bg-[#22c55e]"}`}></div>
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)]">{profile.fullName}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">@{profile.username}</p>
          <span className="mt-2 px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-[var(--primary-light)] text-[var(--primary-green)]">{profile.role}</span>
        </div>

        {/* Action Buttons — Telegram style */}
        <div className="flex gap-3 mb-8">
          <button onClick={startChat}
            className="flex-1 py-3 bg-[var(--primary-green)] text-white rounded-xl font-bold text-sm hover:bg-[#228241] transition flex items-center justify-center gap-2">
            <i className="fa-solid fa-comment"></i> Send Message
          </button>
          <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)] transition">
            <i className="fa-solid fa-phone"></i>
          </button>
          <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)] transition">
            <i className="fa-solid fa-ellipsis"></i>
          </button>
        </div>

        {/* Info Section — Telegram style */}
        <div className="bg-[var(--sidebar-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">Info</h3>
          </div>
          <div className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-main)] cursor-pointer">
            <i className="fa-solid fa-envelope text-[var(--text-muted)] w-5 text-center"></i>
            <div className="flex-1">
              <p className="text-sm text-[var(--text-muted)]">Email</p>
              <p className="text-[var(--text-main)] font-medium">{profile.email}</p>
            </div>
          </div>
          <div className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-main)] cursor-pointer">
            <i className="fa-solid fa-user text-[var(--text-muted)] w-5 text-center"></i>
            <div className="flex-1">
              <p className="text-sm text-[var(--text-muted)]">Username</p>
              <p className="text-[var(--text-main)] font-medium">@{profile.username}</p>
            </div>
          </div>
          <div className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-main)] cursor-pointer">
            <i className="fa-solid fa-users text-[var(--text-muted)] w-5 text-center"></i>
            <div className="flex-1">
              <p className="text-sm text-[var(--text-muted)]">Groups in Common</p>
              <p className="text-[var(--text-main)] font-medium">{profile.groupsCount} groups</p>
            </div>
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <i className="fa-solid fa-calendar text-[var(--text-muted)] w-5 text-center"></i>
            <div className="flex-1">
              <p className="text-sm text-[var(--text-muted)]">Joined</p>
              <p className="text-[var(--text-main)] font-medium">{new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Shared Media — Telegram style */}
        <div className="bg-[var(--sidebar-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">Shared Media</h3>
            <span className="text-xs text-[var(--text-muted)]">{profile.sharedMedia.length} items</span>
          </div>
          {profile.sharedMedia.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <i className="fa-solid fa-image text-3xl text-[var(--border-color)] mb-3 block"></i>
              <p className="text-[var(--text-muted)] text-sm">No shared media yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-1">
              {profile.sharedMedia.map((media) => (
                <div key={media.id} className="aspect-square bg-[var(--bg-main)] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition">
                  {media.fileType === "image" ? (
                    <img src={`${serverUrl}${media.fileUrl}`} alt="" className="w-full h-full object-cover" />
                  ) : media.messageType === "voice" ? (
                    <div className="w-full h-full flex items-center justify-center text-[var(--primary-green)]">
                      <i className="fa-solid fa-microphone text-2xl"></i>
                    </div>
                  ) : (
                    <a href={`${serverUrl}${media.fileUrl}`} target="_blank" className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      <i className="fa-solid fa-file text-2xl"></i>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
