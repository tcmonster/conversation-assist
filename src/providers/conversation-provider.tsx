"use client";

import * as React from "react";

import { createStorageSlot } from "@/lib/storage";

export type ConversationMessageRole = "partner" | "self";

export type ConversationMirrorType = "analysis" | "intent";

export type ConversationMessage = {
  role: ConversationMessageRole;
  content: string;
  timestamp: string;
};

export type ConversationMirror = {
  type: ConversationMirrorType;
  content: string;
  timestamp: string;
  highlights?: string[];
};

export type ConversationFeedRow = {
  id: string;
  message: ConversationMessage;
  mirror: ConversationMirror;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  pinnedAt: string | null;
  archivedAt: string | null;
  feed: ConversationFeedRow[];
};

type ConversationState = {
  activeId: string | null;
  conversations: Record<string, Conversation>;
};

type ConversationAction =
  | { type: "hydrate"; payload: ConversationState }
  | { type: "setActive"; id: string }
  | { type: "create"; payload?: { title?: string } }
  | { type: "togglePin"; id: string }
  | { type: "toggleArchive"; id: string }
  | { type: "rename"; id: string; title: string }
  | { type: "addPartnerMessage"; conversationId: string; content: string }
  | {
      type: "addSelfMessage";
      conversationId: string;
      content: string;
      intent?: string;
    }
  | { type: "addIntentDraft"; conversationId: string; intent: string }
  | { type: "delete"; id: string };

type ConversationContextValue = {
  isHydrated: boolean;
  activeId: string | null;
  activeConversation?: Conversation;
  conversations: Record<string, Conversation>;
  pinnedConversations: Conversation[];
  recentConversations: Conversation[];
  archivedConversations: Conversation[];
  createConversation: () => void;
  renameConversation: (id: string, title: string) => void;
  addPartnerMessage: (content: string) => void;
  addSelfMessage: (content: string, intent?: string) => void;
  addIntentDraft: (intent: string) => void;
  setActiveConversation: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;
  deleteConversation: (id: string) => void;
};

const CONVERSATION_STORAGE = createStorageSlot<ConversationState>({
  key: "conversation-assist.conversations.v1",
  parser: (raw) => parseConversationState(raw),
});

const DEFAULT_TITLE_BASE = "未命名会话";

const LEGACY_SEED_IDS = new Set([
  "acme-rfp",
  "launch-brief",
  "supplier-checkin",
  "support-ticket",
  "contract-revision",
  "pricing-followup",
  "pilot-feedback",
  "holiday-offer",
]);

function createEmptyState(): ConversationState {
  return {
    activeId: null,
    conversations: {},
  };
}

const DEFAULT_CONVERSATION_STATE: ConversationState = createEmptyState();

function generateConversationId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `conversation-${crypto.randomUUID()}`;
  }
  return `conversation-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function generateDefaultTitle(
  conversations: Record<string, Conversation>,
  ignoreId?: string
) {
  const titles = new Set(
    Object.values(conversations)
      .filter((conversation) => conversation.id !== ignoreId)
      .map((conversation) => conversation.title)
  );

  if (!titles.has(DEFAULT_TITLE_BASE)) {
    return DEFAULT_TITLE_BASE;
  }

  let index = 1;
  while (titles.has(`${DEFAULT_TITLE_BASE} ${index}`)) {
    index += 1;
  }
  return `${DEFAULT_TITLE_BASE} ${index}`;
}

function stripLegacySeeds(
  conversations: Record<string, Conversation>
): Record<string, Conversation> {
  const entries = Object.entries(conversations).filter(
    ([id]) => !LEGACY_SEED_IDS.has(id)
  );
  if (entries.length === Object.keys(conversations).length) {
    return conversations;
  }
  return entries.reduce<Record<string, Conversation>>((acc, [id, value]) => {
    acc[id] = value;
    return acc;
  }, {});
}

function createFeedRowId(conversationId: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${conversationId}-row-${crypto.randomUUID()}`;
  }
  return `${conversationId}-row-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function appendFeedRow(
  conversation: Conversation,
  row: ConversationFeedRow
): Conversation {
  return {
    ...conversation,
    feed: [...conversation.feed, row],
    updatedAt: row.message.timestamp,
  };
}

function createPartnerFeedRow(params: {
  conversationId: string;
  content: string;
}): ConversationFeedRow {
  const timestamp = new Date().toISOString();
  return {
    id: createFeedRowId(params.conversationId),
    message: {
      role: "partner",
      content: params.content,
      timestamp,
    },
    mirror: {
      type: "analysis",
      content: "",
      timestamp,
    },
  };
}

function createSelfFeedRow(params: {
  conversationId: string;
  content: string;
  intent?: string;
}): ConversationFeedRow {
  const timestamp = new Date().toISOString();
  return {
    id: createFeedRowId(params.conversationId),
    message: {
      role: "self",
      content: params.content,
      timestamp,
    },
    mirror: {
      type: "intent",
      content: params.intent ?? "",
      timestamp,
    },
  };
}

function parseConversationState(raw: string): ConversationState | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<ConversationState>;
    return normalizeConversationState(parsed);
  } catch (error) {
    console.error("[conversation] Failed to parse state from localStorage", error);
    return undefined;
  }
}

function normalizeConversationState(
  state: Partial<ConversationState> | undefined
): ConversationState {
  if (!state || typeof state !== "object" || state === null) {
    return createEmptyState();
  }

  const source = state.conversations;
  const conversations: Record<string, Conversation> = {};

  if (Array.isArray(source)) {
    for (const item of source) {
      const normalized = normalizeConversation(item);
      if (normalized) {
        conversations[normalized.id] = normalized;
      }
    }
  } else if (source && typeof source === "object") {
    for (const value of Object.values(source as Record<string, unknown>)) {
      const normalized = normalizeConversation(value);
      if (normalized) {
        conversations[normalized.id] = normalized;
      }
    }
  }

  const sanitized = stripLegacySeeds(conversations);

  if (Object.keys(sanitized).length === 0) {
    return createEmptyState();
  }

  const requestedActiveId =
    typeof state.activeId === "string" ? state.activeId : undefined;
  let activeId: string | null =
    requestedActiveId && sanitized[requestedActiveId] ? requestedActiveId : null;

  if (!activeId) {
    const notArchived = Object.values(sanitized).filter(
      (conversation) => !conversation.archivedAt
    );
    const fallbackList =
      notArchived.length > 0 ? notArchived : Object.values(sanitized);
    activeId =
      fallbackList.sort((a, b) => compareDesc(a.updatedAt, b.updatedAt))[0]?.id ??
      null;
  }

  return {
    activeId,
    conversations: sanitized,
  };
}

function normalizeConversation(input: unknown): Conversation | undefined {
  if (!input || typeof input !== "object") return undefined;
  const candidate = input as Partial<Conversation>;
  if (typeof candidate.id !== "string" || typeof candidate.title !== "string") {
    return undefined;
  }

  const feedArray = Array.isArray(candidate.feed)
    ? candidate.feed
    : [];
  const feed: ConversationFeedRow[] = feedArray
    .map((row) => normalizeFeedRow(row))
    .filter((row): row is ConversationFeedRow => Boolean(row));

  return {
    id: candidate.id,
    title: candidate.title,
    updatedAt:
      typeof candidate.updatedAt === "string"
        ? candidate.updatedAt
        : new Date().toISOString(),
    pinnedAt:
      typeof candidate.pinnedAt === "string" ? candidate.pinnedAt : null,
    archivedAt:
      typeof candidate.archivedAt === "string" ? candidate.archivedAt : null,
    feed,
  };
}

function normalizeFeedRow(input: unknown): ConversationFeedRow | undefined {
  if (!input || typeof input !== "object") return undefined;
  const candidate = input as Partial<ConversationFeedRow>;
  if (typeof candidate.id !== "string") return undefined;

  const message = normalizeMessage(candidate.message);
  const mirror = normalizeMirror(candidate.mirror, message?.role);
  if (!message || !mirror) return undefined;

  return {
    id: candidate.id,
    message,
    mirror,
  };
}

function normalizeMessage(
  input: unknown
): ConversationMessage | undefined {
  if (!input || typeof input !== "object") return undefined;
  const candidate = input as Partial<ConversationMessage>;
  if (candidate.role !== "partner" && candidate.role !== "self") {
    return undefined;
  }
  if (typeof candidate.content !== "string") {
    return undefined;
  }
  return {
    role: candidate.role,
    content: candidate.content,
    timestamp:
      typeof candidate.timestamp === "string"
        ? candidate.timestamp
        : new Date().toISOString(),
  };
}

function normalizeMirror(
  input: unknown,
  role: ConversationMessageRole | undefined
): ConversationMirror | undefined {
  if (!input || typeof input !== "object" || !role) return undefined;
  const candidate = input as Partial<ConversationMirror>;
  const expectedType: ConversationMirrorType =
    role === "partner" ? "analysis" : "intent";
  if (candidate.type !== expectedType) {
    return undefined;
  }
  if (typeof candidate.content !== "string") {
    return undefined;
  }

  const highlights =
    Array.isArray(candidate.highlights) && candidate.highlights.length > 0
      ? candidate.highlights.filter(
          (item): item is string => typeof item === "string"
        )
      : undefined;

  return {
    type: expectedType,
    content: candidate.content,
    timestamp:
      typeof candidate.timestamp === "string"
        ? candidate.timestamp
        : new Date().toISOString(),
    highlights,
  };
}

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "setActive":
      if (state.activeId === action.id || !state.conversations[action.id]) {
        return state;
      }
      return { ...state, activeId: action.id };
    case "create": {
      const id = generateConversationId();
      const now = new Date().toISOString();
      const title =
        action.payload?.title && action.payload.title.trim().length > 0
          ? action.payload.title.trim()
          : generateDefaultTitle(state.conversations);
      const conversation: Conversation = {
        id,
        title,
        updatedAt: now,
        pinnedAt: null,
        archivedAt: null,
        feed: [],
      };
      return {
        activeId: id,
        conversations: {
          ...state.conversations,
          [id]: conversation,
        },
      };
    }
    case "togglePin": {
      const conversation = state.conversations[action.id];
      if (!conversation) return state;
      const nextPinnedAt = conversation.pinnedAt ? null : new Date().toISOString();
      const nextConversation: Conversation = {
        ...conversation,
        pinnedAt: nextPinnedAt,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.id]: nextConversation,
        },
      };
    }
    case "toggleArchive": {
      const conversation = state.conversations[action.id];
      if (!conversation) return state;
      const toggledAt = conversation.archivedAt ? null : new Date().toISOString();
      const nextConversation: Conversation = {
        ...conversation,
        archivedAt: toggledAt,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.id]: nextConversation,
        },
      };
    }
    case "rename": {
      const conversation = state.conversations[action.id];
      if (!conversation) return state;
      const trimmed = action.title.trim();
      const nextTitle =
        trimmed.length > 0
          ? trimmed
          : generateDefaultTitle(state.conversations, conversation.id);
      if (nextTitle === conversation.title) {
        return state;
      }
      const nextConversation: Conversation = {
        ...conversation,
        title: nextTitle,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.id]: nextConversation,
        },
      };
    }
    case "addPartnerMessage": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      const row = createPartnerFeedRow({
        conversationId: conversation.id,
        content: action.content,
      });
      const nextConversation = appendFeedRow(conversation, row);
      return {
        activeId: state.activeId ?? conversation.id,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "addSelfMessage": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      const row = createSelfFeedRow({
        conversationId: conversation.id,
        content: action.content,
        intent: action.intent,
      });
      const nextConversation = appendFeedRow(conversation, row);
      return {
        activeId: state.activeId ?? conversation.id,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "addIntentDraft": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      const intentContent = action.intent.trim();
      const row = createSelfFeedRow({
        conversationId: conversation.id,
        content: "（待生成回复）",
        intent: intentContent || "（未填写意图）",
      });
      const nextConversation = appendFeedRow(conversation, row);
      return {
        activeId: state.activeId ?? conversation.id,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "delete": {
      if (!state.conversations[action.id]) return state;
      const { [action.id]: _removed, ...rest } = state.conversations;
      void _removed;
      const nextActive =
        state.activeId === action.id
          ? findNextActiveConversation(rest)
          : state.activeId;
      return {
        activeId: nextActive,
        conversations: rest,
      };
    }
    default:
      return state;
  }
}

function compareDesc(a?: string | null, b?: string | null) {
  const aTime = getTimeValue(a);
  const bTime = getTimeValue(b);
  return bTime - aTime;
}

function getTimeValue(value?: string | null) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function findNextActiveConversation(
  conversations: Record<string, Conversation>
): string | null {
  const available = Object.values(conversations);
  if (available.length === 0) return null;

  const notArchived = available.filter((conversation) => !conversation.archivedAt);
  const pool = notArchived.length > 0 ? notArchived : available;

  return pool.sort((a, b) => compareDesc(a.updatedAt, b.updatedAt))[0]?.id ?? null;
}

const ConversationContext = React.createContext<ConversationContextValue | undefined>(
  undefined
);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(
    conversationReducer,
    DEFAULT_CONVERSATION_STATE
  );
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const restored = CONVERSATION_STORAGE.read();
    if (restored) {
      dispatch({ type: "hydrate", payload: restored });
    }
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    CONVERSATION_STORAGE.write(state);
  }, [state, isHydrated]);

  const conversationsArray = React.useMemo(
    () => Object.values(state.conversations),
    [state.conversations]
  );

  const pinnedConversations = React.useMemo(
    () =>
      conversationsArray
        .filter((conversation) => Boolean(conversation.pinnedAt) && !conversation.archivedAt)
        .sort((a, b) => {
          const byPinned = compareDesc(a.pinnedAt, b.pinnedAt);
          if (byPinned !== 0) return byPinned;
          return compareDesc(a.updatedAt, b.updatedAt);
        }),
    [conversationsArray]
  );

  const archivedConversations = React.useMemo(
    () =>
      conversationsArray
        .filter((conversation) => Boolean(conversation.archivedAt))
        .sort((a, b) => {
          const byArchived = compareDesc(a.archivedAt, b.archivedAt);
          if (byArchived !== 0) return byArchived;
          return compareDesc(a.updatedAt, b.updatedAt);
        }),
    [conversationsArray]
  );

  const recentConversations = React.useMemo(
    () =>
      conversationsArray
        .filter(
          (conversation) => !conversation.pinnedAt && !conversation.archivedAt
        )
        .sort((a, b) => compareDesc(a.updatedAt, b.updatedAt)),
    [conversationsArray]
  );

  const activeConversation =
    state.activeId && state.conversations[state.activeId]
      ? state.conversations[state.activeId]
      : undefined;

  const value = React.useMemo<ConversationContextValue>(
    () => ({
      isHydrated,
      activeId: state.activeId,
      activeConversation,
      conversations: state.conversations,
      pinnedConversations,
      recentConversations,
      archivedConversations,
      createConversation: () => dispatch({ type: "create" }),
      renameConversation: (id: string, title: string) =>
        dispatch({ type: "rename", id, title }),
      addPartnerMessage: (content: string) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({ type: "addPartnerMessage", conversationId: targetId, content });
      },
      addSelfMessage: (content: string, intent?: string) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "addSelfMessage",
          conversationId: targetId,
          content,
          intent,
        });
      },
      addIntentDraft: (intent: string) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "addIntentDraft",
          conversationId: targetId,
          intent,
        });
      },
      setActiveConversation: (id: string) => dispatch({ type: "setActive", id }),
      togglePin: (id: string) => dispatch({ type: "togglePin", id }),
      toggleArchive: (id: string) => dispatch({ type: "toggleArchive", id }),
      deleteConversation: (id: string) => dispatch({ type: "delete", id }),
    }),
    [
      activeConversation,
      archivedConversations,
      isHydrated,
      pinnedConversations,
      recentConversations,
      state.activeId,
      state.conversations,
    ]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = React.useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversations must be used within a ConversationProvider"
    );
  }
  return context;
}
