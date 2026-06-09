"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ProfileModal } from "./ProfileModal";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface Message {
  id: string;
  senderId: string;
  content?: string;
  fileUrl?: string;
  fileType?: "image" | "file" | "voice" | "video";
  messageType: "text" | "attachment" | "voice";
  time: string;
  replyToId?: string;
  forwardedFrom?: string;
  deletedAt?: string;
  editedAt?: string;
  reactions?: Record<string, string[]>;
  roomId?: string;
  receiverId?: string;
  voiceDuration?: number;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  status: string;
  lastMsg: string;
  time?: string;
  badge?: number;
  type: "direct" | "group" | "channel";
  description?: string;
  createdBy?: string;
}

interface ChatUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber?: string | null;
  role: string;
  avatarUrl?: string | null;
}

type SidebarTab = "all" | "direct" | "groups" | "channels" | "trash";
const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👏", "🔥"];
const getWsUrl = () => {
  if (typeof window === "undefined") return "http://localhost:4000";
  // In prod (behind nginx), NEXT_PUBLIC_SERVER_URL is explicitly set to empty string
  // so we use the same origin (nginx proxies /socket.io/ → backend)
  if (process.env.NEXT_PUBLIC_SERVER_URL === "") return window.location.origin;
  // If an explicit non-empty URL is set, honour it
  if (process.env.NEXT_PUBLIC_SERVER_URL) return process.env.NEXT_PUBLIC_SERVER_URL;
  // Dev fallback: server runs on port 4000 on the same host
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:4000`;
};
const SERVER_URL = getWsUrl();

const getFileUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deletedRooms, setDeletedRooms] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [msgInput, setMsgInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<any>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletedMessages, setDeletedMessages] = useState<Message[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [createGroupStep, setCreateGroupStep] = useState<"details" | "members">("details");
  const [newRoomData, setNewRoomData] = useState<{ name: string; type: string; description: string } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [pinnedConvs, setPinnedConvs] = useState<Set<string>>(new Set());
  const [blockedEntities, setBlockedEntities] = useState<Set<string>>(new Set());
  const [showBlocklist, setShowBlocklist] = useState(false);
  const unreadCountsRef = useRef<Map<string, number>>(new Map());
  const [unreadVersion, setUnreadVersion] = useState(0);
  const bumpUnread = () => setUnreadVersion(v => v + 1);
  const notifPermittedRef = useRef(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0); // 0=idle, 1-99=uploading
  const [activeRoomMembers, setActiveRoomMembers] = useState<Array<{ userId: string; role: string }>>([]);
  const [activeRoomRole, setActiveRoomRole] = useState<string | null>(null);
  const [roomMemberSearch, setRoomMemberSearch] = useState("");

  const [showProfileModal, setShowProfileModal] = useState<string | null>(null);
  const [showMemberDirectory, setShowMemberDirectory] = useState(false);
  const [memberDirSearch, setMemberDirSearch] = useState("");

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Per-conversation message storage — keyed by conversation ID
  const messagesByConvRef = useRef<Map<string, Message[]>>(new Map());
  const [messagesVersion, setMessagesVersion] = useState(0);
  const activeMessages = messagesByConvRef.current.get(activeConvId) || [];

  const bumpMessages = () => setMessagesVersion(v => v + 1);

  const setConvMessages = useCallback((convId: string, msgs: Message[]) => {
    messagesByConvRef.current.set(convId, msgs);
    bumpMessages();
  }, []);

  const addMessageToConv = useCallback((convId: string, msg: Message) => {
    const existing = messagesByConvRef.current.get(convId) || [];
    // Avoid duplicate IDs
    if (existing.some(m => m.id === msg.id)) return;
    messagesByConvRef.current.set(convId, [...existing, msg]);
    bumpMessages();
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const isRoomConv = activeConv?.type !== "direct";
  const canManageRoom = isRoomConv && activeRoomRole === "admin";
  const canPostInChannel = activeConv?.type !== "channel" || activeRoomRole === "admin" || activeRoomRole === "manager";

  const getToken = async () => {
    try {
      const res = await fetch("/api/auth/token");
      if (res.ok) {
        const data = await res.json();
        return data.token || null;
      }
    } catch {}
    return null;
  };

  const getTokenFromCookie = () => document.cookie.split("; ").find(r => r.trim().startsWith("moa_token="))?.split("=")[1];

  const getSenderName = useCallback((id: string) => {
    if (id === currentUser?.id) return "You";
    const user = allUsers.find(u => u.id === id);
    return user?.fullName || conversations.find(c => c.id === id)?.name || id.slice(0, 8);
  }, [currentUser, allUsers, conversations]);

  // Persist active conversation across page refreshes
  const lastConvRef = useRef<string>("");

  // Save activeConvId to localStorage whenever it changes
  useEffect(() => {
    if (activeConvId) {
      try { localStorage.setItem("chat_active_conv", activeConvId); } catch {}
    }
  }, [activeConvId]);

  // ── Initial data load ──
  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, usersRes, roomsRes, notifCountRes, pinnedRes, blockedRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/chat/users"),
          fetch("/api/chat/rooms"),
          fetch("/api/chat/notifications/unread-count"),
          fetch("/api/chat/pinned"),
          fetch("/api/chat/blocked"),
        ]);
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setCurrentUser({
            id: session.sub,
            fullName: session.fullName,
            email: session.email,
            username: session.username,
            role: Array.isArray(session.roles) ? session.roles[0] : session.role || "user",
          });
        }
        if (usersRes.ok) setAllUsers(await usersRes.json());
        if (notifCountRes.ok) {
          const { count } = await notifCountRes.json();
          setNotifCount(count);
        }
        if (pinnedRes.ok) {
          const pinned = await pinnedRes.json();
          setPinnedConvs(new Set(pinned.map((p: any) => p.conversationId)));
        }
        if (blockedRes.ok) {
          const blocked = await blockedRes.json();
          setBlockedEntities(new Set(blocked.map((b: any) => b.blockedId)));
        }
        if (roomsRes.ok) {
          const rooms = await roomsRes.json();
          const roomConvs: Conversation[] = rooms.map((r: any) => ({
            id: r.id, name: r.name || "Unnamed",
            avatar: r.avatarUrl || "https://i.pravatar.cc/150?u=group",
            status: r.type === "channel" ? "Channel" : "Group",
            lastMsg: `${r.type} chat`, type: r.type,
            description: r.description, createdBy: r.createdBy,
          }));
          setConversations(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            return [...prev, ...roomConvs.filter(c => !existingIds.has(c.id))];
          });
          if (roomConvs.length > 0 && !activeConvId) {
            // Restore last active conversation from localStorage if it matches a room
            const stored = typeof window !== "undefined" ? localStorage.getItem("chat_active_conv") : null;
            const match = stored ? roomConvs.find(c => c.id === stored) : null;
            setActiveConvId(match ? match.id : roomConvs[0].id);
          }
        }
      } catch (e) { console.error("Initial load failed:", e); }
    })();
  }, []);

  // Build direct conversations
  useEffect(() => {
    if (!allUsers.length || !currentUser) return;
    const directConvs: Conversation[] = allUsers
      .filter(u => u.id !== currentUser.id)
      .map(u => ({
        id: u.id, name: u.fullName,
        avatar: u.avatarUrl ? getFileUrl(u.avatarUrl) : `https://i.pravatar.cc/150?u=${u.id}`,
        status: u.role, lastMsg: "Tap to chat", type: "direct" as const,
      }));
    setConversations(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newOnes = directConvs.filter(c => !existingIds.has(c.id));
      const merged = [...prev, ...newOnes];
      if (!activeConvId && merged.length > 0) {
        // Restore last active conversation from localStorage if it matches a direct conv
        const stored = typeof window !== "undefined" ? localStorage.getItem("chat_active_conv") : null;
        const match = stored ? merged.find(c => c.id === stored) : null;
        setActiveConvId(match ? match.id : merged[0].id);
      }
      return merged;
    });
  }, [allUsers, currentUser]);

  // ── WebSocket ──
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let socketInstance: Socket | null = null;

    const setupSocket = (token: string) => {
      if (cancelled) return;
      const sock = io(SERVER_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
      });
      socketInstance = sock;
      setSocket(sock);

      let isInitialConnect = true;
      sock.on("connect", () => {
        console.log("WS connected to", SERVER_URL);
        // Only clear cache and refetch on RE-connects to fix stuck temp IDs.
        // Doing this on initial connect clears the already-fetched HTTP history.
        if (!isInitialConnect) {
          messagesByConvRef.current.clear();
          setReconnectCount(c => c + 1);
        }
        isInitialConnect = false;
        
        bumpMessages();
        fetchUnreadCounts();
        if (!notifPermittedRef.current && "Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then(p => { if (p === "granted") notifPermittedRef.current = true; });
        } else if ("Notification" in window && Notification.permission === "granted") {
          notifPermittedRef.current = true;
        }
      });

      // Server-side exceptions (e.g. ForbiddenException from gateway handlers)
      sock.on("exception", (err: any) => {
        console.error("WS server exception:", err);
      });
      sock.on("connect_error", (err: any) => console.error("WS connect error:", err.message));

      sock.on("receiveMessage", (data: any) => {
        if (data.roomId && data.senderId === currentUser.id) return; // Deduplicate own room messages
        const msg: Message = { ...data, id: data.id, voiceDuration: data.voiceDuration };
        const convId = data.roomId || data.senderId;
        addMessageToConv(convId, msg);
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, lastMsg: data.content || `Sent a ${data.fileType || "message"}`, time: data.time } : c
        ));
        if (convId !== activeConvId) {
          const cur = unreadCountsRef.current.get(convId) || 0;
          unreadCountsRef.current.set(convId, cur + 1);
          bumpUnread();
        }
        if (notifPermittedRef.current && document.visibilityState !== "visible") {
          const senderLabel = getSenderName(data.senderId);
          new Notification(`Message from ${senderLabel}`, {
            body: data.content?.slice(0, 100) || "Attachment",
            icon: "/favicon.ico",
          });
        }
      });

      sock.on("messageSent", (data: any) => {
        const convId = data.roomId || data.receiverId;
        if (!convId) return;
        const time = data.createdAt
          ? new Date(data.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const existing = messagesByConvRef.current.get(convId) || [];
        // Replace optimistic temp message with the server-confirmed message (real DB id)
        const idx = data.clientMessageId ? existing.findIndex(m => m.id === data.clientMessageId) : -1;
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...data, id: data.id, time };
        } else if (!existing.some(m => m.id === data.id)) {
          existing.push({ ...data, id: data.id, time });
        }
        messagesByConvRef.current.set(convId, [...existing]);
        bumpMessages();
        // Update sidebar last message
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, lastMsg: data.content || `Sent a ${data.fileType || "message"}`, time } : c
        ));
      });

      sock.on("messageEdited", (data: any) => {
        for (const [cid, msgs] of messagesByConvRef.current) {
          const idx = msgs.findIndex(m => m.id === data.messageId);
          if (idx >= 0) {
            msgs[idx] = { ...msgs[idx], content: data.content, editedAt: data.editedAt };
            bumpMessages();
            return;
          }
        }
      });

      sock.on("messageDeleted", (data: any) => {
        for (const [cid, msgs] of messagesByConvRef.current) {
          const filtered = msgs.filter(m => m.id !== data.messageId);
          if (filtered.length !== msgs.length) {
            messagesByConvRef.current.set(cid, filtered);
            bumpMessages();
            return;
          }
        }
      });

      sock.on("messageReaction", (data: any) => {
        for (const [cid, msgs] of messagesByConvRef.current) {
          const msg = msgs.find(m => m.id === data.messageId);
          if (msg) {
            const reactions = { ...msg.reactions };
            if (!reactions[data.emoji]) reactions[data.emoji] = [];
            if (!reactions[data.emoji].includes(data.userId)) reactions[data.emoji].push(data.userId);
            msg.reactions = reactions;
            bumpMessages();
            return;
          }
        }
      });

      sock.on("userTyping", (data: any) => {
        setTypingUsers(prev => { const next = new Set(prev); data.isTyping ? next.add(data.userId) : next.delete(data.userId); return next; });
      });

      sock.on("userStatus", (data: any) => {
        setOnlineUsers(prev => { const next = new Set(prev); data.online ? next.add(data.userId) : next.delete(data.userId); return next; });
      });

      sock.on("roomDeleted", (data: any) => {
        setConversations(prev => prev.filter(c => c.id !== data.roomId));
        if (activeConvId === data.roomId) setActiveConvId("");
        fetchDeletedRooms();
      });

      sock.on("roomEdited", (data: any) => {
        setConversations(prev => prev.map(c => c.id === data.id ? { ...c, name: data.name || c.name, description: data.description, avatar: data.avatarUrl || c.avatar } : c));
      });

      sock.on("roomCreated", (data: any) => {
        setConversations(prev => {
          // Avoid duplicates (creator already added it optimistically)
          if (prev.some(c => c.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            name: data.name,
            avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
            status: data.type,
            lastMsg: data.lastMsg || "Chat created",
            type: data.type as "group" | "channel",
            description: data.description,
          }];
        });
      });

      sock.on("newNotification", (data: any) => {
        setNotifications(prev => [data, ...prev].slice(0, 50));
        setNotifCount(c => c + 1);
      });
    };

    (async () => {
      const token = await getToken();
      if (!cancelled && token) {
        setupSocket(token);
      } else if (!cancelled) {
        retryTimer = setTimeout(() => {
          getToken().then(t => {
            if (!cancelled && t) setupSocket(t);
          });
        }, 2000);
      }
    })();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socketInstance) { socketInstance.disconnect(); setSocket(null); }
    };
  }, [currentUser]);

  // ── Join room WS ──
  useEffect(() => {
    if (!socket || !activeConvId || !activeConv) return;
    if (activeConv.type !== "direct") {
      socket.emit("joinRoom", { roomId: activeConvId });
    }
    return () => {
      if (activeConv.type !== "direct") {
        socket.emit("leaveRoom", { roomId: activeConvId });
      }
    };
  }, [socket, activeConvId, activeConv?.type]);

  // ── Load message history when switching conversations ──
  useEffect(() => {
    if (!activeConvId || !currentUser) return;
    const conv = activeConv;
    if (!conv) return;
    const cached = messagesByConvRef.current.get(activeConvId);
    if (cached && cached.length > 0) {
      bumpMessages();
      return;
    }
    (async () => {
      try {
        const isRoom = conv.type !== "direct";
        const url = isRoom
          ? `/api/chat/rooms/${activeConvId}/messages`
          : `/api/chat/history?receiverId=${activeConvId}`;
        console.log("Fetching history:", url);
        const res = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
        if (!res.ok) {
          console.error("History fetch failed:", res.status, await res.text());
          return;
        }
        const data = await res.json();
        const msgs: Message[] = (Array.isArray(data) ? data : []).map((m: any) => ({
          id: m.id, senderId: m.senderId, content: m.content,
          fileUrl: m.fileUrl, fileType: m.fileType, messageType: m.messageType || "text",
          replyToId: m.replyToId, editedAt: m.editedAt, deletedAt: m.deletedAt,
          roomId: m.roomId, receiverId: m.receiverId,
          voiceDuration: m.voiceDuration,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setConvMessages(activeConvId, msgs);
      } catch (e) { console.error("History fetch error:", e); }
    })();
  }, [activeConvId, currentUser, activeConv, reconnectCount]);

  // ── Load room members + current role ──
  useEffect(() => {
    if (!activeConvId || !currentUser || !activeConv) return;
    if (activeConv.type === "direct") {
      setActiveRoomMembers([]);
      setActiveRoomRole(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/chat/rooms/${activeConvId}/members`);
        if (!res.ok) {
          setActiveRoomMembers([]);
          setActiveRoomRole(null);
          return;
        }
        const members: Array<{ userId: string; role: string }> = await res.json();
        setActiveRoomMembers(members);
        const me = members.find(m => m.userId === currentUser.id);
        setActiveRoomRole(me?.role ?? null);
      } catch {
        setActiveRoomMembers([]);
        setActiveRoomRole(null);
      }
    })();
  }, [activeConvId, currentUser, activeConv?.type]);

  // ── Scroll ──
  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messagesVersion]);

  // ── Click outside handlers ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Deleted rooms ──
  // ── Fetch unread counts from server ──
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [roomRes, directRes] = await Promise.all([
        fetch("/api/chat/unread/rooms"),
        fetch("/api/chat/unread/direct"),
      ]);
      if (roomRes.ok) {
        const roomData: Array<{ roomId: string; count: number }> = await roomRes.json();
        for (const r of roomData) {
          unreadCountsRef.current.set(r.roomId, r.count);
        }
      }
      if (directRes.ok) {
        const directData: Array<{ otherUserId: string; count: number }> = await directRes.json();
        for (const d of directData) {
          unreadCountsRef.current.set(d.otherUserId, d.count);
        }
      }
      bumpUnread();
    } catch {}
  }, [currentUser]);

  // Tab title badge for total unread count
  useEffect(() => {
    let total = 0;
    for (const c of unreadCountsRef.current.values()) total += c;
    if (total > 0) {
      document.title = `(${total > 99 ? "99+" : total}) MOA Connect`;
    } else {
      document.title = "MOA Connect";
    }
  }, [unreadVersion]);

  const fetchDeletedRooms = async () => {
    try {
      const res = await fetch("/api/chat/rooms/deleted");
      if (res.ok) {
        const data = await res.json();
        setDeletedRooms(data.map((r: any) => ({
          id: r.id, name: r.name, avatar: r.avatarUrl || "",
          status: r.type, lastMsg: "Deleted " + new Date(r.deletedAt).toLocaleDateString(),
          type: r.type, description: r.description,
        })));
      }
    } catch {}
  };

  const fetchDeletedMessages = async () => {
    try {
      const res = await fetch("/api/chat/messages/archived");
      if (res.ok) setDeletedMessages(await res.json());
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/chat/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  const markNotificationsRead = async () => {
    try {
      await fetch("/api/chat/notifications/read-all", { method: "PUT" });
      setNotifCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const fetchNotifPrefs = async () => {
    try {
      const res = await fetch("/api/chat/notifications/preferences");
      if (res.ok) setNotifPrefs(await res.json());
    } catch {}
  };

  const saveNotifPrefs = async (prefs: any) => {
    try {
      await fetch("/api/chat/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
      setNotifPrefs(prefs);
    } catch {}
  };

  const handleNotifClick = (notif: any) => {
    // Navigate to the referenced conversation
    const d = notif.data || {};
    const targetId = d.roomId || d.conversationId || d.receiverId || d.senderId;
    if (targetId) {
      setActiveConvId(targetId);
      setShowTrash(false);
      // Determine best sidebar tab
      const isRoom = conversations.find(c => c.id === targetId);
      if (isRoom && isRoom.type !== "direct") setSidebarTab("groups");
      else setSidebarTab("direct");
    }
    setShowNotifDropdown(false);
    // Mark this notification read on server
    fetch(`/api/chat/notifications/${notif.id}/read`, { method: "PUT" }).catch(() => {});
  };

  // ── Typing indicator ──
  const handleTyping = useCallback(() => {
    if (!socket || !activeConvId) return;
    socket.emit("typing", {
      receiverId: activeConv?.type === "direct" ? activeConvId : undefined,
      roomId: activeConv?.type !== "direct" ? activeConvId : undefined,
      isTyping: true,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        receiverId: activeConv?.type === "direct" ? activeConvId : undefined,
        roomId: activeConv?.type !== "direct" ? activeConvId : undefined,
        isTyping: false,
      });
    }, 2000);
  }, [socket, activeConvId, activeConv?.type]);

  // ── Send message ──
  const [sending, setSending] = useState(false);

  const sendMsg = useCallback(async (override?: Partial<Message>) => {
    const content = override?.content ?? msgInput;
    if ((!content && !override?.fileUrl) || !currentUser || !socket) return;
    const isRoom = activeConv?.type !== "direct";
    setSending(true);

    const tempId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newMsg: Message = {
      id: tempId, senderId: currentUser.id,
      content: override?.content || content,
      fileUrl: override?.fileUrl, fileType: override?.fileType,
      messageType: override?.messageType || "text",
      voiceDuration: override?.voiceDuration,
      replyToId: replyingTo?.id,
      roomId: isRoom ? activeConvId : undefined,
      receiverId: isRoom ? undefined : activeConvId,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...override,
    };

    addMessageToConv(activeConvId, newMsg);
    setConversations(prev => prev.map(c =>
      c.id === activeConvId ? { ...c, lastMsg: content || "Attachment", time: newMsg.time } : c
    ));

    setMsgInput(""); setShowEmojiPicker(false); setReplyingTo(null);

    // Emit via WebSocket exclusively (gateway saves to DB and broadcasts)
    socket.emit("sendMessage", {
      receiverId: isRoom ? undefined : activeConvId,
      roomId: isRoom ? activeConvId : undefined,
      content: newMsg.content,
      fileUrl: newMsg.fileUrl,
      fileType: newMsg.fileType,
      messageType: newMsg.messageType,
      voiceDuration: newMsg.voiceDuration,
      replyToId: replyingTo?.id,
      clientMessageId: tempId,
    });

    setSending(false);
  }, [currentUser, activeConv, activeConvId, replyingTo, msgInput, socket, addMessageToConv, setConvMessages]);

  // ── Edit / Delete ──
  const startEdit = (msg: Message) => { setEditingMsgId(msg.id); setEditContent(msg.content || ""); };
  const saveEdit = () => {
    if (!socket || !editingMsgId || !editContent.trim()) return;
    const isRoom = activeConv?.type !== "direct";
    socket.emit("editMessage", { messageId: editingMsgId, content: editContent, receiverId: isRoom ? undefined : activeConvId, roomId: isRoom ? activeConvId : undefined });
    setEditingMsgId(null); setEditContent("");
  };
  const cancelEdit = () => { setEditingMsgId(null); setEditContent(""); };

  const handleDelete = (msg: Message) => {
    if (!socket) return;
    const isRoom = activeConv?.type !== "direct";
    socket.emit("deleteMessage", { messageId: msg.id, receiverId: isRoom ? undefined : activeConvId, roomId: isRoom ? activeConvId : undefined });
  };

  const handleRestoreMessage = async (messageId: string) => {
    if (!socket) return;
    socket.emit("restoreMessage", { messageId });
    setDeletedMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!socket || !confirm("Delete this " + (activeConv?.type ?? "chat") + "? It will go to trash.")) return;
    socket.emit("deleteRoom", { roomId });
    setActiveConvId("");
    fetchDeletedRooms();
  };

  const handleRestoreRoom = async (roomId: string) => {
    try {
      await fetch(`/api/chat/rooms/${roomId}/restore`, { method: "POST" });
      fetchDeletedRooms();
      const res = await fetch("/api/chat/rooms");
      if (res.ok) {
        const rooms = await res.json();
        const roomConvs = rooms.map((r: any) => ({
          id: r.id, name: r.name, avatar: r.avatarUrl || "https://i.pravatar.cc/150?u=group",
          status: r.type, lastMsg: `${r.type} chat`, type: r.type, description: r.description,
        }));
        setConversations(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          return [...prev.filter(c => c.type === "direct"), ...roomConvs.filter((c: any) => !existingIds.has(c.id))];
        });
      }
    } catch {}
  };

  const handleEditRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeConvId || !socket) return;
    const fd = new FormData(e.currentTarget);
    socket.emit("editRoom", { roomId: activeConvId, name: fd.get("name") as string, description: fd.get("description") as string });
    setShowEditRoom(false);
  };

  // ── File upload ──
  const handleFileUpload = async (file: File, voiceDuration?: number) => {
    if (!currentUser) return;
    setUploadProgress(1);
    const fd = new FormData();
    fd.append("file", file);
    try {
      // Use XHR so we can track upload progress
      const token = await getToken();
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/chat/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.min(95, Math.round((e.loaded / e.total) * 100)));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(fd);
      });
      setUploadProgress(100);
      const isVoice = data.fileType === "voice" || file.type.includes("webm") || file.type.includes("m4a") || file.name.endsWith(".webm");
      await sendMsg({
        messageType: isVoice ? "voice" : "attachment",
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        content: data.originalName,
        voiceDuration: isVoice ? (voiceDuration || 0) : undefined,
      });
    } catch (e: any) {
      console.error("Upload error:", e);
      alert(e.message || "Upload failed — check console");
    } finally {
      setUploadProgress(0);
    }
  };

  // ── Voice ──
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [voicePlayingId, setVoicePlayingId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0); // 0-100
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      setRecordingTime(0);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      const chunks: Blob[] = [];
      const startTime = Date.now();
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        if (chunks.length === 0) { stream.getTracks().forEach(t => t.stop()); alert("No audio recorded"); return; }
        const blob = new Blob(chunks, { type: mimeType });
        const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const ext = mimeType.includes("webm") ? "webm" : "m4a";
        await handleFileUpload(new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType }), duration);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { alert("Microphone access denied — check browser permissions"); }
  };

  const [voiceCurrentTimeMap, setVoiceCurrentTimeMap] = useState<Record<string, number>>({});

  const toggleVoicePlay = (msgId: string, fileUrl: string, duration?: number) => {
    if (voicePlayingId === msgId) {
      voiceAudioRef.current?.pause();
      setVoicePlayingId(null);
      return;
    }
    if (voiceAudioRef.current) { voiceAudioRef.current.pause(); }
    const audio = new Audio(getFileUrl(fileUrl));
    voiceAudioRef.current = audio;
    setVoiceProgress(0);
    setVoiceCurrentTimeMap(prev => ({ ...prev, [msgId]: 0 }));
    audio.addEventListener("timeupdate", () => {
      const d = (audio.duration && isFinite(audio.duration)) ? audio.duration : (duration || 0);
      if (d > 0) {
        setVoiceProgress(Math.round((audio.currentTime / d) * 100));
      }
      setVoiceCurrentTimeMap(prev => ({ ...prev, [msgId]: Math.floor(audio.currentTime) }));
    });
    audio.addEventListener("ended", () => { setVoicePlayingId(null); setVoiceProgress(0); setVoiceCurrentTimeMap(prev => ({ ...prev, [msgId]: 0 })); });
    audio.addEventListener("error", () => { setVoicePlayingId(null); setVoiceProgress(0); });
    audio.play().catch(() => { setVoicePlayingId(null); setVoiceProgress(0); });
    setVoicePlayingId(msgId);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); };
  const handleReaction = (msgId: string, emoji: string) => {
    if (!socket) return;
    const isRoom = activeConv?.type !== "direct";
    socket.emit("addReaction", { messageId: msgId, emoji, receiverId: isRoom ? undefined : activeConvId, roomId: isRoom ? activeConvId : undefined });
    setShowReactionPicker(null);
  };
  const handleForward = (msg: Message, targetId: string) => {
    if (!socket) return;
    socket.emit("forwardMessage", { message: msg, targetUserId: targetId });
    setShowForwardModal(null);
  };

  // ── Group/Channel creation with member selection ──
  const startCreateGroup = () => {
    setShowCreateGroup(true);
    setCreateGroupStep("details");
    setNewRoomData(null);
    setSelectedMembers([]);
  };

  const handleDetailsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setNewRoomData({
      name: fd.get("name") as string,
      type: fd.get("type") as string,
      description: fd.get("description") as string || "",
    });
    setCreateGroupStep("members");
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const createGroupFinal = async () => {
    if (!newRoomData) return;
    try {
      const avatarUrl = `https://i.pravatar.cc/150?u=${encodeURIComponent(newRoomData.name)}`;
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomData.name,
          type: newRoomData.type,
          description: newRoomData.description,
          avatarUrl,
          memberIds: selectedMembers,
        }),
      });
      if (res.ok) {
        const room = await res.json();
        // Creator sees it immediately; other members get roomCreated via WS
        setConversations(prev => {
          if (prev.some(c => c.id === room.id)) return prev;
          return [...prev, {
            id: room.id, name: newRoomData.name,
            avatar: avatarUrl,
            status: newRoomData.type, lastMsg: "Chat created",
            type: newRoomData.type as "group" | "channel",
            description: newRoomData.description,
          }];
        });
        setShowCreateGroup(false);
        setSelectedMembers([]);
        setNewRoomData(null);
        setCreateGroupStep("details");
        setActiveConvId(room.id);
      } else { alert("Failed to create"); }
    } catch { alert("Failed to create"); }
  };

  // Add member to existing group
  const addMemberToRoom = async (roomId: string, userId: string) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const r = await fetch(`/api/chat/rooms/${roomId}/members`);
        if (r.ok) setActiveRoomMembers(await r.json());
      }
    } catch {}
  };

  const removeMemberFromRoom = async (roomId: string, userId: string) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/members/${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (res.ok) {
        const r = await fetch(`/api/chat/rooms/${roomId}/members`);
        if (r.ok) setActiveRoomMembers(await r.json());
      }
    } catch {}
  };

  const handleTogglePin = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    try {
      const isPinned = pinnedConvs.has(conversationId);
      const res = await fetch(isPinned ? `/api/chat/pinned/${conversationId}` : "/api/chat/pinned", {
        method: isPinned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isPinned ? undefined : JSON.stringify({ conversationId }),
      });
      if (res.ok) {
        setPinnedConvs(prev => {
          const next = new Set(prev);
          if (isPinned) next.delete(conversationId);
          else next.add(conversationId);
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to toggle pin", err);
    }
  };

  const handleToggleBlock = async (blockedId: string) => {
    try {
      const isBlocked = blockedEntities.has(blockedId);
      const res = await fetch(isBlocked ? `/api/chat/blocked/${blockedId}` : "/api/chat/blocked", {
        method: isBlocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isBlocked ? undefined : JSON.stringify({ blockedId }),
      });
      if (res.ok) {
        setBlockedEntities(prev => {
          const next = new Set(prev);
          if (isBlocked) next.delete(blockedId);
          else next.add(blockedId);
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to toggle block", err);
    }
  };

  const filteredConversations = conversations
    .filter(c => !blockedEntities.has(c.id))
    .filter(c => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const user = allUsers.find(u => u.id === c.id);
        const matchMeta = user
          ? (user.email?.toLowerCase().includes(q) ||
              user.username?.toLowerCase().includes(q) ||
              (user.phoneNumber ?? "").toLowerCase().includes(q))
          : false;
        if (!matchName && !matchMeta) return false;
      }
      if (sidebarTab === "all") return true;
      if (sidebarTab === "direct") return c.type === "direct";
      if (sidebarTab === "groups") return c.type === "group";
      if (sidebarTab === "channels") return c.type === "channel";
      return true;
    })
    .sort((a, b) => {
      const aPinned = pinnedConvs.has(a.id);
      const bPinned = pinnedConvs.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // You could add further sorting by lastMsg time here if available
      return 0;
    });

  const typingNames = Array.from(typingUsers).map(id => getSenderName(id));

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[var(--bg-main)] overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <style jsx global>{`
        :root { --primary-green: #1A7554; --primary-light: #eaf6ee; --bg-main: #f8fafc; --sidebar-bg: #ffffff; --text-main: #1e293b; --text-muted: #64748b; --border-color: #e2e8f0; --sender-bubble: #1a7f5c; --sender-text: #ffffff; --receiver-bubble: #f1f5f9; --receiver-text: #1e293b; --telegram-sender: #dcf8c5; --telegram-receiver: #ffffff; }
        [data-theme="dark"] { --bg-main: #0f172a; --sidebar-bg: #1e293b; --text-main: #f8fafc; --text-muted: #94a3b8; --border-color: #334155; --receiver-bubble: #334155; --receiver-text: #e2e8f0; --primary-light: rgba(26,117,84,0.1); --telegram-sender: #2b5278; --telegram-receiver: #1e293b; }
        .messages-container { background-image: radial-gradient(var(--border-color) 1px, transparent 1px); background-size: 20px 20px; }
        @media (max-width: 768px) { .sidebar { width: 80px; } .sidebar-header, .contact-info, .search-container { display: none; } .contact { justify-content: center; padding: 10px; } }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar w-[350px] bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col z-10">
        <div className="sidebar-header p-[20px] border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[1.2rem] font-extrabold text-[var(--primary-green)]">MOA Connect</h2>
            <div className="flex items-center gap-2">
              <div className="relative" ref={notifDropdownRef}>
                <button onClick={() => { fetchNotifications(); setShowNotifDropdown(true); }}
                  className="w-8 h-8 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary-green)] relative">
                  <i className="fa-solid fa-bell text-xs"></i>
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.55rem] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold">{notifCount > 99 ? "99+" : notifCount}</span>
                  )}
                </button>
              </div>
              <button
                onClick={() => { if (currentUser?.id) setShowProfileModal(currentUser.id); }}
                className="w-8 h-8 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary-green)] overflow-hidden"
                title={currentUser?.id ? "My Profile" : "Login to view profile"}>
                {(() => {
                  const me = allUsers.find(u => u.id === currentUser?.id);
                  return me?.avatarUrl
                    ? <img src={getFileUrl(me.avatarUrl)} alt="" className="w-full h-full object-cover rounded-full" />
                    : <i className="fa-solid fa-user text-xs"></i>;
                })()}
              </button>
              <button onClick={() => setShowBlocklist(true)} className="w-8 h-8 rounded-full bg-[var(--bg-main)] text-[var(--text-muted)] flex items-center justify-center hover:text-[var(--primary-green)]" title="Blocked Users">
                <i className="fa-solid fa-shield-halved text-xs"></i>
              </button>
              <button onClick={startCreateGroup} className="w-8 h-8 rounded-full bg-[var(--primary-green)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)]" title="Create Group/Channel">
                <i className="fa-solid fa-plus text-xs"></i>
              </button>
            </div>
          </div>
          <div className="search-container relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-[10px_10px_10px_36px] rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-main)] outline-none text-[0.85rem] text-[var(--text-main)]" />
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex border-b border-[var(--border-color)] px-2 gap-1">
          {(["all", "direct", "groups", "channels", "trash"] as SidebarTab[]).map(tab => (
            <button key={tab} onClick={() => {
              setSidebarTab(tab);
              if (tab === "trash") { fetchDeletedRooms(); fetchDeletedMessages(); setShowTrash(true); } else setShowTrash(false);
            }}
              className={`flex-1 py-2 text-[0.75rem] font-semibold rounded-t-[8px] transition ${sidebarTab === tab ? "text-[var(--primary-green)] border-b-2 border-[var(--primary-green)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
              {tab === "all" ? "All" : tab === "direct" ? "Private" : tab === "groups" ? "Groups" : tab === "channels" ? "Channels" : "Trash"}
            </button>
          ))}
        </div>

        <div className="contact-list flex-1 overflow-y-auto p-[8px]">
          {!showTrash && filteredConversations.map(conv => (
            <div key={conv.id} onClick={() => {
              setActiveConvId(conv.id); setShowTrash(false);
              unreadCountsRef.current.set(conv.id, 0); bumpUnread();
              // Mark as read on server
              if (conv.type === "direct") {
                fetch(`/api/chat/direct/${conv.id}/read`, { method: "POST" }).catch(() => {});
              } else {
                fetch(`/api/chat/rooms/${conv.id}/read`, { method: "POST" }).catch(() => {});
              }
            }}
              className={`contact flex items-center gap-3 p-3 rounded-[12px] cursor-pointer transition-colors mb-0.5 ${activeConvId === conv.id ? "bg-[var(--primary-light)] border-l-3 border-[var(--primary-green)]" : "hover:bg-[var(--primary-light)]"}`}>
              <div className="avatar-wrapper relative flex-shrink-0">
                <div onClick={e => { e.stopPropagation(); setShowProfileModal(conv.id); }} title="View Profile">
                  <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-full object-cover bg-[#eee] hover:opacity-80 transition" />
                </div>
                {onlineUsers.has(conv.id) && conv.type === "direct" && <div className="absolute bottom-[2px] right-[2px] w-3 h-3 bg-[var(--primary-green)] border-2 border-white rounded-full"></div>}
                {conv.type !== "direct" && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary-green)] text-white rounded-full flex items-center justify-center text-[0.5rem]"><i className={`fa-solid ${conv.type === "channel" ? "fa-bullhorn" : "fa-users"}`}></i></div>}
              </div>
              <div className="contact-info flex-1 overflow-hidden min-w-0">
                <div className="name font-bold text-[0.9rem] mb-[2px] flex justify-between text-[var(--text-main)]">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{conv.name}</span>
                    {conv.type === "direct" && (
                      <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                        conv.status === "admin" ? "bg-purple-100 text-purple-700" :
                        conv.status === "supervisor" ? "bg-blue-100 text-blue-700" :
                        "bg-[var(--primary-light)] text-[var(--primary-green)]"
                      }`}>{conv.status}</span>
                    )}
                    {conv.type !== "direct" && (
                      <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0 bg-[var(--primary-light)] text-[var(--primary-green)]">{conv.type}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleTogglePin(e, conv.id)} className={`text-[0.75rem] transition hover:scale-110 ${pinnedConvs.has(conv.id) ? "text-[var(--primary-green)]" : "text-[var(--border-color)] hover:text-[var(--text-muted)]"}`}>
                      <i className="fa-solid fa-thumbtack"></i>
                    </button>
                    {conv.time && <span className="text-[0.65rem] text-[var(--text-muted)] font-normal flex-shrink-0">{conv.time}</span>}
                  </div>
                </div>
                <div className="last-msg text-[0.78rem] text-[var(--text-muted)] whitespace-nowrap overflow-hidden text-ellipsis flex justify-between">
                  <span>{conv.lastMsg}</span>
                  {conv.badge ? <span className="bg-[var(--primary-green)] text-white text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold">{conv.badge}</span> :
                    (() => { const c = unreadCountsRef.current.get(conv.id) || 0; void unreadVersion; return c > 0 ? <span className="bg-red-500 text-white text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold">{c > 99 ? "99+" : c}</span> : null; })()
                  }
                </div>
              </div>
            </div>
          ))}

          {/* Trash view */}
          {showTrash && (
            <div className="p-2">
              <h4 className="text-[0.75rem] font-bold text-[var(--text-muted)] uppercase px-2 mb-2">Deleted Rooms</h4>
              {deletedRooms.length === 0 && <p className="text-[0.8rem] text-[var(--text-muted)] px-2">No deleted rooms</p>}
              {deletedRooms.map(room => (
                <div key={room.id} className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-[var(--bg-main)] mb-1">
                  <img src={room.avatar} className="w-8 h-8 rounded-full" alt="" />
                  <div className="flex-1 min-w-0"><div className="text-[0.85rem] font-semibold text-[var(--text-main)] truncate">{room.name}</div><div className="text-[0.7rem] text-[var(--text-muted)]">{room.lastMsg}</div></div>
                  <button onClick={() => handleRestoreRoom(room.id)} className="text-[0.7rem] text-[var(--primary-green)] hover:underline">Restore</button>
                </div>
              ))}
              <h4 className="text-[0.75rem] font-bold text-[var(--text-muted)] uppercase px-2 mt-4 mb-2">Deleted Messages</h4>
              {deletedMessages.length === 0 && <p className="text-[0.8rem] text-[var(--text-muted)] px-2">No deleted messages</p>}
              {deletedMessages.map(msg => (
                <div key={msg.id} className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-[var(--bg-main)] mb-1">
                  <div className="flex-1 min-w-0"><div className="text-[0.85rem] text-[var(--text-main)] truncate">{msg.content || "Attachment"}</div><div className="text-[0.7rem] text-[var(--text-muted)]">Deleted at {new Date(msg.deletedAt!).toLocaleString()}</div></div>
                  <button onClick={() => handleRestoreMessage(msg.id)} className="text-[0.7rem] text-[var(--primary-green)] hover:underline">Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-main)] relative" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="h-16 px-[20px] flex items-center justify-between bg-[var(--sidebar-bg)] border-b border-[var(--border-color)]">
              <div className="flex items-center gap-[12px]">
                <div onClick={() => setShowProfileModal(activeConv.id)}>
                  <img src={activeConv.avatar} className="w-[40px] h-[40px] rounded-full hover:opacity-80 transition cursor-pointer" alt="" />
                </div>
                <div>
                  <h4 className="font-bold text-[0.95rem] text-[var(--text-main)]">{activeConv.name}</h4>
                  <p className="text-[0.72rem] text-[var(--primary-green)] font-semibold">
                    {activeConv.type === "direct" && onlineUsers.has(activeConvId) ? "Online" : `${activeConv.type} • ${activeConv.status}`}
                    {typingNames.length > 0 && ` • ${typingNames.join(", ")} typing...`}
                  </p>
                </div>
              </div>
              <div className="flex gap-[8px]">
                {activeConv.type !== "direct" && (
                  <button
                    onClick={() => { setShowMemberDirectory(v => !v); setMemberDirSearch(""); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-[8px] text-xs transition ${showMemberDirectory ? "bg-[var(--primary-green)] text-white" : "bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--primary-green)]"}`}
                    title="Member Directory"
                  >
                    <i className="fa-solid fa-users-rectangle"></i>
                  </button>
                )}
                {activeConv.type !== "direct" && canManageRoom && (
                  <>
                    <button onClick={() => setShowEditRoom(true)} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--primary-green)]" title="Edit"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                    <button onClick={() => handleDeleteRoom(activeConvId)} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-red-500" title="Delete"><i className="fa-solid fa-trash-can text-xs"></i></button>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container flex-1 p-[20px] overflow-y-auto flex flex-col-reverse gap-2" ref={chatBoxRef}>
              {activeMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-[0.9rem]">
                  No messages yet. Say hello!
                </div>
              )}
              {activeMessages.slice().reverse().map(msg => {
                const isMe = msg.senderId === currentUser?.id;
                const repliedMsg = msg.replyToId ? activeMessages.find(m => m.id === msg.replyToId) : null;
                const isEditing = editingMsgId === msg.id;
                return (
                  <div key={msg.id} className={`message max-w-[65%] flex flex-col group ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                    {repliedMsg && (
                      <div className={`text-[0.7rem] px-3 py-1 rounded-t-[10px] mb-[-3px] opacity-70 ${isMe ? "bg-[#1f7a3a] text-white/70" : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"}`}>
                        {getSenderName(repliedMsg.senderId)}: {repliedMsg.content?.slice(0, 40)}
                      </div>
                    )}
                    {activeConv.type !== "direct" && !isMe && (
                      <span className="text-[0.65rem] text-[var(--primary-green)] font-bold ml-2 mb-0.5">{getSenderName(msg.senderId)}</span>
                    )}
                    <div className={`msg-content p-[8px_14px] rounded-[16px] text-[0.9rem] leading-[1.4] relative ${isMe ? "bg-[#dcf8c5] text-[#303030] rounded-br-[4px]" : "bg-white text-[#303030] rounded-bl-[4px] border border-[#e2e8f0]"}`}>
                      {msg.forwardedFrom && <div className="text-[0.6rem] opacity-60 mb-0.5">Forwarded from {getSenderName(msg.forwardedFrom)}</div>}
                      {isEditing ? (
                        <div className="flex gap-1 items-center">
                          <input value={editContent} onChange={e => setEditContent(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                            className="flex-1 bg-white/20 rounded px-2 py-1 text-[0.85rem] outline-none border-none text-inherit" autoFocus />
                          <button onClick={saveEdit} className="text-[0.7rem] px-1 hover:opacity-80"><i className="fa-solid fa-check"></i></button>
                          <button onClick={cancelEdit} className="text-[0.7rem] px-1 hover:opacity-80"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                      ) : msg.messageType === "voice" && msg.fileUrl ? (
                        (() => {
                          // Deterministic waveform from message ID
                          const bars = Array.from({ length: 30 }, (_, i) => {
                            const c = msg.id.charCodeAt(i % msg.id.length);
                            return 20 + ((c * (i + 3) * 13) % 65);
                          });
                          const dur = msg.voiceDuration || 0;
                          const curTime = voiceCurrentTimeMap[msg.id] || 0;
                          const isPlaying = voicePlayingId === msg.id;
                          const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
                          return (
                            <div className="flex items-center gap-2.5" style={{ minWidth: 220, maxWidth: 300 }}>
                              {/* Play/Pause button */}
                              <button
                                onClick={() => toggleVoicePlay(msg.id, msg.fileUrl!, dur)}
                                className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-transform active:scale-95 shadow ${
                                  isMe ? "bg-white/25 text-white hover:bg-white/35" : "bg-[var(--primary-green)] text-white hover:brightness-110"
                                }`}
                              >
                                <i className={`fa-solid text-[0.85rem] ${isPlaying ? "fa-pause" : "fa-play ml-0.5"}`}></i>
                              </button>
                              {/* Waveform + time */}
                              <div className="flex-1 min-w-0">
                                {/* Waveform bars */}
                                <div className="flex items-end gap-[2px]" style={{ height: 32 }}>
                                  {bars.map((h, i) => {
                                    const pct = (i / bars.length) * 100;
                                    const active = isPlaying && pct <= voiceProgress;
                                    return (
                                      <div
                                        key={i}
                                        className={`rounded-full flex-shrink-0 transition-all duration-75 ${
                                          active
                                            ? isMe ? "bg-white" : "bg-[var(--primary-green)]"
                                            : isMe ? "bg-white/35" : "bg-gray-300"
                                        }`}
                                        style={{ width: 3, height: `${h}%` }}
                                      />
                                    );
                                  })}
                                </div>
                                {/* Time row */}
                                <div className="flex justify-between mt-0.5">
                                  <span className={`text-[0.6rem] font-medium tabular-nums ${ isMe ? "text-white/70" : "text-gray-500" }`}>
                                    {isPlaying ? fmtTime(curTime) : "0:00"}
                                  </span>
                                  <span className={`text-[0.6rem] font-medium tabular-nums ${ isMe ? "text-white/70" : "text-gray-500" }`}>
                                    {dur > 0 ? fmtTime(dur) : "0:00"}
                                  </span>
                                </div>
                              </div>
                              {/* Mic badge */}
                              <i className={`fa-solid fa-microphone text-[0.65rem] flex-shrink-0 ${ isMe ? "text-white/40" : "text-gray-400" }`}></i>
                            </div>
                          );
                        })()
                      ) : msg.messageType === "attachment" && msg.fileUrl ? (
                        <div className="flex flex-col gap-1">
                          {msg.fileType === "image" ? (
                            <div
                              className="relative group cursor-zoom-in"
                              onClick={() => setLightboxUrl(getFileUrl(msg.fileUrl))}
                            >
                              <img
                                src={getFileUrl(msg.fileUrl)}
                                alt=""
                                className="max-w-full rounded-lg max-h-[280px] object-cover block"
                                onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg bg-black/20">
                                <i className="fa-solid fa-expand text-white text-lg drop-shadow"></i>
                              </div>
                            </div>
                          ) : msg.fileType === "video" ? (
                            <div className="relative rounded-xl overflow-hidden bg-black max-w-[340px] shadow-lg">
                              <video
                                src={getFileUrl(msg.fileUrl)}
                                controls
                                preload="metadata"
                                className="w-full max-h-[260px] rounded-xl block"
                                style={{ background: "#000" }}
                              >
                                Your browser does not support video playback.
                              </video>
                              <a
                                href={getFileUrl(msg.fileUrl)}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 bg-black/60 text-white text-[0.6rem] px-2 py-1 rounded-md flex items-center gap-1 hover:bg-black/80 transition"
                              >
                                <i className="fa-solid fa-download"></i> Save
                              </a>
                            </div>
                          ) : (
                            <a
                              href={getFileUrl(msg.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={msg.content || true}
                              className={`flex items-center gap-3 p-2.5 rounded-xl no-underline transition hover:opacity-80 min-w-[180px] ${
                                isMe ? "bg-white/15" : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isMe ? "bg-white/20" : "bg-[var(--primary-green)]/10"
                              }`}>
                                <i className={`fa-solid text-sm ${
                                  /\.(pdf)$/i.test(msg.content || "") ? "fa-file-pdf text-red-500" :
                                  /\.(docx?)$/i.test(msg.content || "") ? "fa-file-word text-blue-500" :
                                  /\.(xlsx?)$/i.test(msg.content || "") ? "fa-file-excel text-green-500" :
                                  /\.(zip|rar|7z|tar)$/i.test(msg.content || "") ? "fa-file-zipper text-yellow-500" :
                                  "fa-file text-gray-500"
                                }`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-[0.8rem] font-semibold truncate leading-tight ${ isMe ? "text-white" : "text-[var(--text-main)]" }`}>
                                  {msg.content || "File"}
                                </div>
                                <div className={`text-[0.65rem] mt-0.5 ${ isMe ? "text-white/60" : "text-[var(--text-muted)]" }`}>
                                  <i className="fa-solid fa-download mr-1"></i>Download
                                </div>
                              </div>
                            </a>
                          )}
                        </div>
                      ) : (
                        <span>{msg.content}{msg.editedAt && <span className="text-[0.6rem] opacity-50 ml-1">(edited)</span>}</span>
                      )}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <span key={emoji} className="bg-white/20 rounded-full px-1.5 py-0.5 text-[0.6rem]" title={users.map(id => getSenderName(id)).join(", ")}>{emoji} {users.length}</span>
                          ))}
                        </div>
                      )}
                      {!isEditing && (
                        <div className="absolute -top-[10px] right-2 hidden group-hover:flex gap-0.5 bg-[var(--sidebar-bg)] rounded-full px-1.5 py-0.5 shadow-md border border-[var(--border-color)]">
                          <button onClick={() => setReplyingTo(msg)} className="w-5 h-5 flex items-center justify-center rounded-full text-[0.55rem] hover:bg-[var(--bg-main)]" title="Reply"><i className="fa-solid fa-reply"></i></button>
                          {isMe && <button onClick={() => startEdit(msg)} className="w-5 h-5 flex items-center justify-center rounded-full text-[0.55rem] hover:bg-[var(--bg-main)]" title="Edit"><i className="fa-solid fa-pen-to-square"></i></button>}
                          <button onClick={() => setShowReactionPicker(msg.id)} className="w-5 h-5 flex items-center justify-center rounded-full text-[0.55rem] hover:bg-[var(--bg-main)]" title="React"><i className="fa-regular fa-face-smile"></i></button>
                          <button onClick={() => setShowForwardModal(msg)} className="w-5 h-5 flex items-center justify-center rounded-full text-[0.55rem] hover:bg-[var(--bg-main)]" title="Forward"><i className="fa-solid fa-share"></i></button>
                          {isMe && <button onClick={() => handleDelete(msg)} className="w-5 h-5 flex items-center justify-center rounded-full text-[0.55rem] hover:bg-red-100 hover:text-red-500" title="Delete"><i className="fa-solid fa-trash-can"></i></button>}
                        </div>
                      )}
                    </div>
                    <div className={`msg-time text-[0.65rem] text-[var(--text-muted)] mt-[2px] font-semibold ${isMe ? "text-right" : ""}`}>{msg.time}</div>
                  </div>
                );
              })}
            </div>

            {/* Reply bar and Input */}
            {canPostInChannel ? (
              <>
                {replyingTo && (
                  <div className="mx-[20px] mb-2 p-2 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between border border-[var(--border-color)]">
                    <span className="text-[0.75rem] text-[var(--text-muted)]">Replying to {getSenderName(replyingTo.senderId)}: {replyingTo.content?.slice(0, 60)}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-[var(--text-muted)] hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                )}
                <div className="p-[12px_20px] bg-[var(--sidebar-bg)] border-t border-[var(--border-color)] flex items-center gap-[10px] relative">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  <div onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[var(--bg-main)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--primary-green)] hover:bg-[var(--primary-light)]"><i className="fa-solid fa-paperclip text-sm"></i></div>
                  <div className="flex-1 bg-[var(--bg-main)] p-[4px_12px] rounded-[12px] flex items-center border border-[var(--border-color)]">
                    <textarea
                      className="flex-1 px-2 py-2 bg-transparent border-none focus:outline-none resize-none overflow-hidden min-h-[40px] max-h-[120px] text-[var(--text-main)] text-[0.9rem]"
                      placeholder="Type a message... (Ctrl+Enter for new line)"
                      value={msgInput}
                      onChange={e => {
                        setMsgInput(e.target.value);
                        handleTyping();
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
                          e.preventDefault();
                          sendMsg();
                          e.currentTarget.style.height = 'auto';
                        } else if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault();
                          setMsgInput(prev => prev + "\n");
                        }
                      }}
                      rows={1}
                    />
                    <div className="relative" ref={emojiPickerRef}>
                      <i className={`fa-regular fa-face-smile text-[var(--text-muted)] cursor-pointer hover:text-[var(--primary-green)] ${showEmojiPicker ? "text-[var(--primary-green)]" : ""}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}></i>
                      {showEmojiPicker && (
                        <div className="absolute bottom-[45px] right-0 z-[1000]">
                          <EmojiPicker onEmojiClick={(d: any) => setMsgInput(p => p + d.emoji)} autoFocusSearch={false}
                            theme={typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark" ? "dark" as any : "light" as any} />
                        </div>
                      )}
                    </div>
                  </div>
                  {isRecording ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-[10px] px-2 py-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                      <span className="text-[0.75rem] font-mono font-bold text-red-600 min-w-[36px]">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                      </span>
                      <button
                        onClick={() => {
                          mediaRecorderRef.current?.stop();
                          setIsRecording(false);
                          if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
                          setRecordingTime(0);
                        }}
                        title="Cancel recording"
                        className="text-gray-400 hover:text-red-500 transition text-xs"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                      <button
                        onClick={toggleRecording}
                        title="Stop and send"
                        className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                      >
                        <i className="fa-solid fa-stop text-[0.65rem]"></i>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={toggleRecording}
                      title="Record voice memo"
                      className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--primary-green)] hover:bg-[var(--primary-light)] transition"
                    >
                      <i className="fa-solid fa-microphone text-sm"></i>
                    </button>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <button onClick={() => sendMsg()} className="w-[40px] h-[40px] bg-[var(--primary-green)] text-white border-none rounded-[10px] cursor-pointer flex items-center justify-center text-[1rem] hover:scale-105 hover:bg-[#154735] transition">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-[12px_20px] bg-[var(--sidebar-bg)] border-t border-[var(--border-color)] flex items-center justify-center">
                <span className="text-[0.85rem] text-[var(--text-muted)] font-medium">Only admins and managers can post in this channel.</span>
              </div>
            )}
            
            {/* Member Directory Sidebar */}
            {showMemberDirectory && activeConv.type !== "direct" && (
              <div className="absolute top-16 right-0 bottom-0 w-[300px] bg-[var(--sidebar-bg)] border-l border-[var(--border-color)] shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
                <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]">
                  <h3 className="font-bold text-[var(--text-main)]"><i className="fa-solid fa-users mr-2"></i>Members</h3>
                  <button onClick={() => setShowMemberDirectory(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="p-3 border-b border-[var(--border-color)]">
                  <div className="bg-[var(--bg-main)] rounded-lg flex items-center px-3 py-1.5 border border-[var(--border-color)]">
                    <i className="fa-solid fa-magnifying-glass text-[0.7rem] text-[var(--text-muted)]"></i>
                    <input
                      value={memberDirSearch}
                      onChange={e => setMemberDirSearch(e.target.value)}
                      placeholder="Search members..."
                      className="bg-transparent border-none outline-none text-sm ml-2 w-full text-[var(--text-main)]"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {activeRoomMembers
                    .map(m => ({ m, u: allUsers.find(x => x.id === m.userId) }))
                    .filter(({ u }) => !memberDirSearch || u?.fullName.toLowerCase().includes(memberDirSearch.toLowerCase()) || u?.email.toLowerCase().includes(memberDirSearch.toLowerCase()))
                    .map(({ m, u }) => (
                      <div key={m.userId} onClick={() => setShowProfileModal(m.userId)} className="p-3 flex items-center gap-3 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--bg-main)] transition">
                        <div className="relative">
                          <img src={`https://i.pravatar.cc/150?u=${m.userId}`} className="w-10 h-10 rounded-full object-cover" alt="" />
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--sidebar-bg)] ${onlineUsers.has(m.userId) ? "bg-[var(--primary-green)]" : "bg-gray-400"}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-[var(--text-main)] truncate">{u?.fullName || "User"}</div>
                          <div className="text-[0.65rem] text-[var(--primary-green)] uppercase font-bold">{m.role}</div>
                        </div>
                      </div>
                    ))}
                  {activeRoomMembers.length === 0 && <div className="p-4 text-center text-sm text-[var(--text-muted)]">No members found</div>}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-[1rem]">
            {sidebarTab === "trash" ? "Trash — restore items below" : "Select a conversation to start messaging"}
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Lightbox for full-size images */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition text-xl"
            onClick={() => setLightboxUrl(null)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <a
            href={lightboxUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm transition"
            onClick={e => e.stopPropagation()}
          >
            <i className="fa-solid fa-download"></i> Download
          </a>
        </div>
      )}

      {showReactionPicker && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center" onClick={() => setShowReactionPicker(null)}>
          <div className="bg-[var(--sidebar-bg)] rounded-xl shadow-lg p-3 flex gap-2 border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
            {EMOJI_LIST.map(e => <button key={e} onClick={() => handleReaction(showReactionPicker, e)} className="text-xl hover:scale-125 transition">{e}</button>)}
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className="fixed inset-0 z-[3000] bg-black/30 flex items-center justify-center" onClick={() => setShowForwardModal(null)}>
          <div className="bg-[var(--sidebar-bg)] rounded-xl p-6 w-[380px] max-h-[450px] overflow-y-auto shadow-lg border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-[var(--text-main)]">Forward to...</h3>
            <div className="flex flex-col gap-2">
              {conversations.map(c => (
                <button key={c.id} onClick={() => handleForward(showForwardModal, c.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-main)] text-left text-[var(--text-main)]">
                  <img src={c.avatar} className="w-8 h-8 rounded-full" alt="" />
                  <div><div className="font-semibold text-sm">{c.name}</div><div className="text-[0.65rem] text-[var(--text-muted)] uppercase">{c.type}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create modal — step 1: details */}
      {showCreateGroup && createGroupStep === "details" && (
        <div className="fixed inset-0 z-[3000] bg-black/30 flex items-center justify-center" onClick={() => setShowCreateGroup(false)}>
          <div className="bg-[var(--sidebar-bg)] rounded-xl p-6 w-[420px] shadow-lg border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-[var(--text-main)]">New Chat</h3>
            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-3">
              <input name="name" placeholder="Chat name" required className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] outline-none" />
              <input name="description" placeholder="Description (optional)" className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] outline-none" />
              <select name="type" className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] outline-none">
                <option value="group">Group (everyone can send)</option>
                <option value="channel">Channel (only admins post)</option>
              </select>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-main)]">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[var(--primary-green)] text-white">Next: Add Members</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create modal — step 2: select members */}
      {showCreateGroup && createGroupStep === "members" && newRoomData && (
        <div className="fixed inset-0 z-[3000] bg-black/30 flex items-center justify-center" onClick={() => setShowCreateGroup(false)}>
          <div className="bg-[var(--sidebar-bg)] rounded-xl p-6 w-[420px] max-h-[550px] overflow-y-auto shadow-lg border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 text-[var(--text-main)]">Add Members</h3>
            <p className="text-[0.8rem] text-[var(--text-muted)] mb-3">Select members for <b>{newRoomData.name}</b></p>
            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto mb-4">
              {allUsers.filter(u => u.id !== currentUser?.id).map(user => (
                <label key={user.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-main)] ${selectedMembers.includes(user.id) ? "bg-[var(--primary-light)]" : ""}`}>
                  <input type="checkbox" checked={selectedMembers.includes(user.id)} onChange={() => toggleMemberSelection(user.id)} className="w-4 h-4 accent-[var(--primary-green)]" />
                  <img src={`https://i.pravatar.cc/150?u=${user.id}`} className="w-8 h-8 rounded-full" alt="" />
                  <div>
                    <div className="text-[0.85rem] font-semibold text-[var(--text-main)]">{user.fullName}</div>
                    <div className="text-[0.7rem] text-[var(--text-muted)]">{user.role}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCreateGroupStep("details")} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-main)]">Back</button>
              <button type="button" onClick={createGroupFinal} className="px-4 py-2 rounded-lg bg-[var(--primary-green)] text-white">Create ({selectedMembers.length} members)</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit room modal */}
      {showEditRoom && activeConv && canManageRoom && (
        <div className="fixed inset-0 z-[3000] bg-black/30 flex items-center justify-center" onClick={() => setShowEditRoom(false)}>
          <div className="bg-[var(--sidebar-bg)] rounded-xl p-6 w-[400px] shadow-lg border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-[var(--text-main)]">Edit {activeConv.type}</h3>
            <form onSubmit={handleEditRoom} className="flex flex-col gap-3">
              <input name="name" placeholder="Name" defaultValue={activeConv.name} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] outline-none" />
              <input name="description" placeholder="Description" defaultValue={activeConv.description || ""} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] outline-none" />
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" onClick={() => setShowEditRoom(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-main)]">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[var(--primary-green)] text-white">Save</button>
              </div>
            </form>
            <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
              <h4 className="text-sm font-bold text-[var(--text-muted)] mb-2">Members</h4>
              <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center gap-2">
                  <i className="fa-solid fa-magnifying-glass text-[0.75rem] text-[var(--text-muted)]"></i>
                  <input
                    value={roomMemberSearch}
                    onChange={(e) => setRoomMemberSearch(e.target.value)}
                    placeholder="Search users (name, email, phone)"
                    className="flex-1 bg-transparent outline-none text-[0.8rem] text-[var(--text-main)]"
                  />
                </div>
                <div className="max-h-[180px] overflow-y-auto">
                  {activeRoomMembers.map((m) => {
                    const u = allUsers.find(x => x.id === m.userId);
                    const label = u?.fullName ?? m.userId.slice(0, 8);
                    return (
                      <div key={m.userId} className="px-3 py-2 flex items-center gap-2 border-b border-[var(--border-color)] last:border-b-0">
                        <img src={`https://i.pravatar.cc/150?u=${m.userId}`} className="w-7 h-7 rounded-full" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.8rem] font-semibold text-[var(--text-main)] truncate">{label}</div>
                          <div className="text-[0.65rem] text-[var(--text-muted)] uppercase">{m.role}</div>
                        </div>
                        {m.userId !== currentUser?.id && (
                          <button
                            onClick={() => removeMemberFromRoom(activeConvId, m.userId)}
                            className="text-[0.7rem] text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {activeRoomMembers.length === 0 && (
                    <div className="px-3 py-4 text-[0.8rem] text-[var(--text-muted)]">No members found</div>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-bold text-[var(--text-muted)] mb-2 mt-3">Add Member</h4>
              <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1">
                {allUsers
                  .filter(u => u.id !== currentUser?.id)
                  .filter(u => !activeRoomMembers.some(m => m.userId === u.id))
                  .filter(u => {
                    const q = roomMemberSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      u.fullName.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q) ||
                      (u.phoneNumber ?? "").toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 30)
                  .map(user => (
                    <button
                      key={user.id}
                      onClick={() => addMemberToRoom(activeConvId, user.id)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--primary-light)] text-left"
                    >
                      <img src={`https://i.pravatar.cc/150?u=${user.id}`} className="w-7 h-7 rounded-full" alt="" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.8rem] font-semibold text-[var(--text-main)] truncate">{user.fullName}</div>
                        <div className="text-[0.65rem] text-[var(--text-muted)] truncate">
                          {user.phoneNumber ? `${user.phoneNumber} • ` : ""}{user.email}
                        </div>
                      </div>
                      <i className="fa-solid fa-plus text-[0.7rem] text-[var(--primary-green)]"></i>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showNotifPrefs && notifPrefs && (
        <div className="fixed inset-0 z-[4000] bg-black/30 flex items-center justify-center" onClick={() => setShowNotifPrefs(false)}>
          <div className="bg-[var(--sidebar-bg)] rounded-xl p-6 w-[400px] shadow-lg border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-[var(--text-main)]">Notification Preferences</h3>
            {["messages", "groups", "channels", "mentions", "sound", "desktop"].map(key => (
              <label key={key} className="flex items-center justify-between py-2 cursor-pointer">
                <span className="text-[var(--text-main)] capitalize">{key}</span>
                <input type="checkbox" checked={notifPrefs[key]} onChange={e => saveNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
                  className="w-5 h-5 accent-[var(--primary-green)] rounded" />
              </label>
            ))}
            <button onClick={() => setShowNotifPrefs(false)} className="mt-4 w-full py-2 rounded-lg bg-[var(--primary-green)] text-white font-semibold">Done</button>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifDropdown && (
        <div className="fixed inset-0 z-[4500] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowNotifDropdown(false)}>
          <div className="bg-[var(--sidebar-bg)] w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--sidebar-bg)]">
              <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                <i className="fa-solid fa-bell text-[var(--primary-green)]"></i> Notifications
              </h2>
              <div className="flex items-center gap-3">
                <button onClick={markNotificationsRead} className="text-xs font-semibold text-[var(--primary-green)] hover:underline" title="Mark all as read">Mark all read</button>
                <button onClick={() => { fetchNotifPrefs(); setShowNotifPrefs(true); }} className="w-8 h-8 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-muted)] transition flex items-center justify-center" title="Settings"><i className="fa-solid fa-gear"></i></button>
                <button onClick={() => setShowNotifDropdown(false)} className="w-8 h-8 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)] transition flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-[var(--bg-main)]">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)]">
                  <i className="fa-regular fa-bell-slash text-4xl mb-3 opacity-50"></i>
                  <p className="text-sm">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n: any) => (
                    <div key={n.id} onClick={() => handleNotifClick(n)} className={`p-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--sidebar-bg)] transition flex items-start gap-3 ${!n.read ? "bg-[var(--primary-light)]" : ""}`}>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-[var(--primary-green)] shadow-[0_0_8px_var(--primary-green)]" : "bg-transparent"}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--text-main)] mb-0.5">{n.title}</p>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{n.body}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)] mt-2 font-medium">{new Date(n.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blocklist Modal */}
      {showBlocklist && (
        <div className="fixed inset-0 z-[4500] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowBlocklist(false)}>
          <div className="bg-[var(--sidebar-bg)] w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-[var(--primary-green)]"></i> Blocked Entities
              </h2>
              <button onClick={() => setShowBlocklist(false)} className="w-8 h-8 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)] transition flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-4">
              {blockedEntities.size === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">No blocked users or channels.</div>
              ) : (
                Array.from(blockedEntities).map(id => {
                  const user = allUsers.find(u => u.id === id);
                  const room = conversations.find(c => c.id === id);
                  const name = user?.fullName || room?.name || "Unknown";
                  return (
                    <div key={id} className="flex items-center justify-between p-3 mb-2 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--border-color)]">
                      <span className="text-sm font-semibold text-[var(--text-main)] truncate max-w-[70%]">{name}</span>
                      <button onClick={() => handleToggleBlock(id)} className="text-xs px-3 py-1.5 rounded-md bg-[var(--primary-light)] text-[var(--primary-green)] font-bold hover:bg-[#d1ecd9]">
                        Unblock
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal
          userId={showProfileModal}
          onClose={() => setShowProfileModal(null)}
          onStartChat={(id) => {
            setShowProfileModal(null);
            setActiveConvId(id);
            setSidebarTab("all");
          }}
          currentUserId={currentUser?.id}
          onProfileUpdated={(updatedAvatarUrl, updatedFullName) => {
            if (!currentUser) return;
            const targetUserId = showProfileModal;
            // Refresh allUsers so sidebar avatar and name reflect the change
            setAllUsers(prev => prev.map(u =>
              u.id === targetUserId
                ? { ...u, avatarUrl: updatedAvatarUrl ?? u.avatarUrl, fullName: updatedFullName ?? u.fullName }
                : u
            ));
            // Refresh conversations list (direct conv entry for self won't exist, but
            // the profile button rerenders via allUsers dependency)
            setConversations(prev => prev.map(c =>
              c.id === targetUserId
                ? { ...c, name: updatedFullName ?? c.name, avatar: updatedAvatarUrl ? getFileUrl(updatedAvatarUrl) : c.avatar }
                : c
            ));
          }}
        />
      )}

      {/* Voice Recording Snackbar */}
      {isRecording && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[5000] bg-[#1e293b] text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200 min-w-[280px] border border-red-500/30">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Recording voice message</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}</p>
          </div>
          <button onClick={toggleRecording} className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition">
            <i className="fa-solid fa-stop text-red-400"></i>
          </button>
          <div className="absolute -bottom-1 left-4 right-4 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 h-1 bg-red-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s`, width: `${30 + Math.random() * 70}%` }}></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
