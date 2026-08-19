import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ref,
  push,
  onValue,
  off,
  serverTimestamp,
  query,
  limitToLast,
  set,
  onDisconnect,
  get,
} from "firebase/database";
import { db } from "../firebase"; // ajuste o caminho conforme seu projeto
import { useAuth } from "../Authcontext"; // ajuste o caminho conforme seu projeto
import "./comunidade.css";

// ─── Utilitários ────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function isSameDay(ts1, ts2) {
  const a = new Date(ts1);
  const b = new Date(ts2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(ts) {
  const today = new Date();
  const d = new Date(ts);
  if (isSameDay(d, today)) return "Hoje";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36, style = {} }) {
  const initials = getInitials(name);
  return (
    <div
      className="cn-chat__avatar"
      style={{ width: size, height: size, fontSize: size * 0.35, ...style }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ─── UserItem ────────────────────────────────────────────────────────────────

function UserItem({ user, isSelf }) {
  return (
    <div className={`cn-chat__user-item${isSelf ? " cn-chat__user-item--self" : ""}`}>
      <div className="cn-chat__user-avatar-wrap">
        <Avatar name={user.displayName} size={30} />
        <span
          className={`cn-chat__presence cn-chat__presence--${user.status || "online"}`}
          aria-label={user.status || "online"}
        />
      </div>
      <div className="cn-chat__user-info">
        <span className="cn-chat__user-name">
          {user.displayName}
          {isSelf ? " (você)" : ""}
        </span>
        {user.role && <span className="cn-chat__user-role">{user.role}</span>}
      </div>
    </div>
  );
}

// ─── MessageGroup ────────────────────────────────────────────────────────────

function MessageGroup({ msg, isSelf }) {
  return (
    <div className={`cn-chat__msg-group${isSelf ? " cn-chat__msg-group--self" : ""}`}>
      <Avatar name={msg.authorName} size={36} />
      <div className="cn-chat__msg-body">
        <div className="cn-chat__msg-meta">
          <span className="cn-chat__msg-author">{msg.authorName}</span>
          {msg.authorRole && msg.authorRole !== "membro" && (
            <span className={`cn-chat__badge cn-chat__badge--${msg.authorRole}`}>
              {msg.authorRole}
            </span>
          )}
          <span className="cn-chat__msg-time">{formatTimestamp(msg.createdAt)}</span>
        </div>
        <p className="cn-chat__msg-text">{msg.text}</p>
      </div>
    </div>
  );
}

// ─── DaySeparator ────────────────────────────────────────────────────────────

function DaySeparator({ label }) {
  return (
    <div className="cn-chat__separator" aria-label={`Mensagens de ${label}`}>
      <span className="cn-chat__separator-line" />
      <span className="cn-chat__separator-label">{label}</span>
      <span className="cn-chat__separator-line" />
    </div>
  );
}

// ─── TypingIndicator ─────────────────────────────────────────────────────────

function TypingIndicator({ typingUsers, currentUid }) {
  const others = typingUsers.filter((u) => u.uid !== currentUid);
  if (!others.length) return <div className="cn-chat__typing-placeholder" />;

  const names =
    others.length === 1
      ? others[0].name
      : others.slice(0, 2).map((u) => u.name).join(", ");

  const verb = others.length === 1 ? "está digitando" : "estão digitando";

  return (
    <div className="cn-chat__typing">
      <span className="cn-chat__typing-dots" aria-hidden="true">
        <span /><span /><span />
      </span>
      <span>{names} {verb}…</span>
    </div>
  );
}

// ─── ComunidadeChat ──────────────────────────────────────────────────────────

export default function ComunidadeChat() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Redireciona usuários não autenticados
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // ── Presença online ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const userPresenceRef = ref(db, `presence/${currentUser.uid}`);
    const connectedRef = ref(db, ".info/connected");

    const unsub = onValue(connectedRef, (snap) => {
      if (!snap.val()) return;

      set(userPresenceRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Usuário",
        status: "online",
        lastSeen: serverTimestamp(),
      });

      onDisconnect(userPresenceRef).set({
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Usuário",
        status: "offline",
        lastSeen: serverTimestamp(),
      });
    });

    return () => off(connectedRef, "value", unsub);
  }, [currentUser]);

  // ── Ouvir usuários online ────────────────────────────────────────────────
  useEffect(() => {
    const presenceRef = ref(db, "presence");
    const unsub = onValue(presenceRef, (snap) => {
      const data = snap.val() || {};
      setOnlineUsers(
        Object.values(data).filter((u) => u.status === "online")
      );
    });
    return () => off(presenceRef, "value", unsub);
  }, []);

  // ── Ouvir mensagens ──────────────────────────────────────────────────────
  useEffect(() => {
    const messagesRef = query(
      ref(db, "chat/geral/messages"),
      limitToLast(100)
    );

    const unsub = onValue(messagesRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => a.createdAt - b.createdAt);
      setMessages(list);
      setLoading(false);
    });

    return () => off(messagesRef, "value", unsub);
  }, []);

  // ── Ouvir quem está digitando ────────────────────────────────────────────
  useEffect(() => {
    const typingRef = ref(db, "chat/geral/typing");
    const unsub = onValue(typingRef, (snap) => {
      const data = snap.val() || {};
      const now = Date.now();
      // Remove entradas com mais de 5 segundos (garbage collect)
      const active = Object.values(data).filter(
        (u) => now - (u.startedAt || 0) < 5000
      );
      setTypingUsers(active);
    });
    return () => off(typingRef, "value", unsub);
  }, []);

  // ── Scroll automático ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Enviar mensagem ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !currentUser) return;

    const displayName =
      currentUser.displayName ||
      currentUser.email?.split("@")[0] ||
      "Usuário";

    // Busca role do usuário (opcional — armazena em /users/{uid}/role)
    let role = "membro";
    try {
      const roleSnap = await get(ref(db, `users/${currentUser.uid}/role`));
      if (roleSnap.exists()) role = roleSnap.val();
    } catch (_) {}

    await push(ref(db, "chat/geral/messages"), {
      text,
      authorId: currentUser.uid,
      authorName: displayName,
      authorRole: role,
      createdAt: serverTimestamp(),
    });

    // Limpa typing
    await set(ref(db, `chat/geral/typing/${currentUser.uid}`), null);
    isTypingRef.current = false;
    clearTimeout(typingTimeoutRef.current);

    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [inputText, currentUser]);

  // ── Gerenciar indicador de digitação ────────────────────────────────────
  const handleTyping = useCallback(
    (value) => {
      if (!currentUser) return;
      const typingRef = ref(db, `chat/geral/typing/${currentUser.uid}`);

      if (value.trim() && !isTypingRef.current) {
        isTypingRef.current = true;
        set(typingRef, {
          uid: currentUser.uid,
          name:
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "Usuário",
          startedAt: Date.now(),
        });
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        set(typingRef, null);
        isTypingRef.current = false;
      }, 3000);

      if (!value.trim() && isTypingRef.current) {
        set(typingRef, null);
        isTypingRef.current = false;
      }
    },
    [currentUser]
  );

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    handleTyping(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Agrupa mensagens por dia para separadores ────────────────────────────
  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    if (!prev || !isSameDay(prev.createdAt, msg.createdAt)) {
      acc.push({ type: "separator", label: dayLabel(msg.createdAt) });
    }
    acc.push({ type: "message", msg });
    return acc;
  }, []);

  if (!currentUser) return null;

  return (
    <div className="cn-chat">
      {/* ── Sidebar de usuários ─────────────────────────────────────────── */}
      <aside className="cn-chat__sidebar" aria-label="Usuários online">
        <div className="cn-chat__sidebar-header">
          <span className="cn-chat__sidebar-title">Comunidade</span>
          <div className="cn-chat__online-count">
            <span className="cn-chat__online-dot" aria-hidden="true" />
            {onlineUsers.length} online
          </div>
        </div>

        <ul className="cn-chat__user-list" role="list">
          {onlineUsers.map((u) => (
            <li key={u.uid} role="listitem">
              <UserItem user={u} isSelf={u.uid === currentUser.uid} />
            </li>
          ))}
          {onlineUsers.length === 0 && (
            <li className="cn-chat__user-empty">Ninguém online</li>
          )}
        </ul>
      </aside>

      {/* ── Área principal ──────────────────────────────────────────────── */}
      <main className="cn-chat__main">
        {/* Header do canal */}
        <header className="cn-chat__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="cn-chat__channel-name">#geral</span>
          <span className="cn-chat__channel-desc">Chat da comunidade Counter-News</span>
        </header>

        {/* Mensagens */}
        <section
          className="cn-chat__messages"
          aria-label="Mensagens do canal geral"
          aria-live="polite"
        >
          {loading && (
            <div className="cn-chat__loading">Carregando mensagens…</div>
          )}

          {!loading && messages.length === 0 && (
            <div className="cn-chat__empty">
              <p>Nenhuma mensagem ainda. Seja o primeiro a falar!</p>
            </div>
          )}

          {groupedMessages.map((item, i) =>
            item.type === "separator" ? (
              <DaySeparator key={`sep-${i}`} label={item.label} />
            ) : (
              <MessageGroup
                key={item.msg.id}
                msg={item.msg}
                isSelf={item.msg.authorId === currentUser.uid}
              />
            )
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} currentUid={currentUser.uid} />

        {/* Input */}
        <div className="cn-chat__input-area">
          <div className="cn-chat__input-wrapper">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8e98c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <textarea
              ref={textareaRef}
              className="cn-chat__input"
              placeholder="Envie uma mensagem para a comunidade…"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              aria-label="Campo de mensagem"
            />
            <button
              className="cn-chat__send-btn"
              onClick={sendMessage}
              disabled={!inputText.trim()}
              aria-label="Enviar mensagem"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="cn-chat__input-hint">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </main>
    </div>
  );
}