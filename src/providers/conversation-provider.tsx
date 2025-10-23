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
  status?: "idle" | "loading" | "ready" | "error";
  error?: string | null;
};

export type ConversationFeedRow = {
  id: string;
  message: ConversationMessage;
  mirror?: ConversationMirror | null;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  pinnedAt: string | null;
  archivedAt: string | null;
  feed: ConversationFeedRow[];
  replyLanguage: string;
  tonePresetId: string;
  selectedReferenceIds: string[];
  selectedQuoteIds: string[];
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
  | { type: "setReplyLanguage"; conversationId: string; replyLanguage: string }
  | {
      type: "setTonePreset";
      conversationId: string;
      tonePresetId: string;
    }
  | {
      type: "setSelectedReferenceIds";
      conversationId: string;
      referenceIds: string[];
    }
  | {
      type: "setSelectedQuoteIds";
      conversationId: string;
      quoteIds: string[];
    }
  | {
      type: "addPartnerMessage";
      conversationId: string;
      content: string;
      rowId?: string;
    }
  | {
      type: "addSelfMessage";
      conversationId: string;
      content: string;
      intent?: string;
      rowId?: string;
    }
  | {
      type: "updateMessage";
      conversationId: string;
      rowId: string;
      content: string;
      intent?: string;
    }
  | {
      type: "updateMirror";
      conversationId: string;
      rowId: string;
      mirror: Partial<ConversationMirror>;
    }
  | {
      type: "removeFeedRow";
      conversationId: string;
      rowId: string;
    }
  | {
      type: "addIntentDraft";
      conversationId: string;
      intent: string;
      rowId?: string;
    }
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
  addPartnerMessage: (content: string) => string | undefined;
  addSelfMessage: (content: string, intent?: string) => string | undefined;
  addIntentDraft: (intent: string) => string | undefined;
  updateMessage: (rowId: string, content: string, options?: { intent?: string }) => void;
  removeFeedRow: (rowId: string) => void;
  updateMirror: (rowId: string, mirror: Partial<ConversationMirror>) => void;
  setActiveConversation: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;
  deleteConversation: (id: string) => void;
  setReplyLanguage: (replyLanguage: string) => void;
  setTonePreset: (tonePresetId: string) => void;
  setSelectedReferenceIds: (ids: string[]) => void;
  setSelectedQuoteIds: (ids: string[]) => void;
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
  id?: string;
}): ConversationFeedRow {
  const timestamp = new Date().toISOString();
  return {
    id: params.id ?? createFeedRowId(params.conversationId),
    message: {
      role: "partner",
      content: params.content,
      timestamp,
    },
    mirror: {
      type: "analysis",
      content: "",
      timestamp,
      status: "idle",
      error: null,
    },
  };
}

function createSelfFeedRow(params: {
  conversationId: string;
  content: string;
  intent?: string;
  id?: string;
}): ConversationFeedRow {
  const timestamp = new Date().toISOString();
  return {
    id: params.id ?? createFeedRowId(params.conversationId),
    message: {
      role: "self",
      content: params.content,
      timestamp,
    },
    mirror: {
      type: "intent",
      content: params.intent ?? "",
      timestamp,
      status: "idle",
      error: null,
    },
  };
}

function updateFeedRow(
  conversation: Conversation,
  rowId: string,
  updater: (row: ConversationFeedRow) => ConversationFeedRow
): Conversation {
  const nextFeed = conversation.feed.map((row) =>
    row.id === rowId ? updater(row) : row
  );
  const latestRow = nextFeed.find((row) => row.id === rowId);
  const updatedAt =
    latestRow?.message.timestamp ?? conversation.updatedAt;
  return {
    ...conversation,
    feed: nextFeed,
    updatedAt,
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
    replyLanguage:
      typeof (candidate as { replyLanguage?: unknown }).replyLanguage === "string" &&
      (candidate as { replyLanguage?: string }).replyLanguage?.trim()
        ? ((candidate as { replyLanguage?: string }).replyLanguage as string)
        : "auto",
    tonePresetId:
      typeof (candidate as { tonePresetId?: unknown }).tonePresetId === "string"
        ? ((candidate as { tonePresetId?: string }).tonePresetId as string)
        : "concise",
    selectedReferenceIds: Array.isArray(
      (candidate as { selectedReferenceIds?: unknown }).selectedReferenceIds
    )
      ? dedupeIds(
          ((candidate as { selectedReferenceIds?: string[] }).selectedReferenceIds ?? []).filter(
            (item): item is string => typeof item === "string"
          )
        )
      : [],
    selectedQuoteIds: Array.isArray(
      (candidate as { selectedQuoteIds?: unknown }).selectedQuoteIds
    )
      ? dedupeIds(
          ((candidate as { selectedQuoteIds?: string[] }).selectedQuoteIds ?? []).filter(
            (item): item is string => typeof item === "string"
          )
        )
      : [],
  };
}

function normalizeFeedRow(input: unknown): ConversationFeedRow | undefined {
  if (!input || typeof input !== "object") return undefined;
  const candidate = input as Partial<ConversationFeedRow>;
  if (typeof candidate.id !== "string") return undefined;

  const message = normalizeMessage(candidate.message);
  if (!message) return undefined;
  const mirror =
    candidate.mirror === null || candidate.mirror === undefined
      ? undefined
      : normalizeMirror(candidate.mirror, message.role) ?? undefined;

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

  const statusCandidate =
    typeof (candidate as { status?: unknown }).status === "string"
      ? ((candidate as { status?: string }).status as string)
      : undefined;

  const allowedStatuses: ConversationMirror["status"][] = [
    "idle",
    "loading",
    "ready",
    "error",
  ];
  const status = allowedStatuses.includes(statusCandidate as ConversationMirror["status"])
    ? (statusCandidate as ConversationMirror["status"])
    : candidate.content && candidate.content.trim().length > 0
      ? "ready"
      : "idle";

  const errorMessage =
    typeof (candidate as { error?: unknown }).error === "string"
      ? ((candidate as { error?: string }).error as string)
      : null;

  return {
    type: expectedType,
    content: candidate.content,
    timestamp:
      typeof candidate.timestamp === "string"
        ? candidate.timestamp
        : new Date().toISOString(),
    highlights,
    status,
    error: errorMessage,
  };
}

function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed) continue;
    seen.add(trimmed);
  }
  return Array.from(seen);
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
        replyLanguage: "auto",
        tonePresetId: "concise",
        selectedReferenceIds: [],
        selectedQuoteIds: [],
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
    case "setReplyLanguage": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      if (conversation.replyLanguage === action.replyLanguage) {
        return state;
      }
      const nextConversation: Conversation = {
        ...conversation,
        replyLanguage: action.replyLanguage,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "setTonePreset": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      if (conversation.tonePresetId === action.tonePresetId) {
        return state;
      }
      const nextConversation: Conversation = {
        ...conversation,
        tonePresetId: action.tonePresetId,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "setSelectedReferenceIds": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      const nextIds = dedupeIds(action.referenceIds);
      if (
        nextIds.length === conversation.selectedReferenceIds.length &&
        nextIds.every((id) => conversation.selectedReferenceIds.includes(id))
      ) {
        return state;
      }
      const nextConversation: Conversation = {
        ...conversation,
        selectedReferenceIds: nextIds,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "setSelectedQuoteIds": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      const nextIds = dedupeIds(action.quoteIds);
      if (
        nextIds.length === conversation.selectedQuoteIds.length &&
        nextIds.every((id) => conversation.selectedQuoteIds.includes(id))
      ) {
        return state;
      }
      const nextConversation: Conversation = {
        ...conversation,
        selectedQuoteIds: nextIds,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "addPartnerMessage": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      const row = createPartnerFeedRow({
        conversationId: conversation.id,
        content: action.content,
        id: action.rowId,
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
        id: action.rowId,
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
        id: action.rowId,
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
    case "updateMessage": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      if (!conversation.feed.some((row) => row.id === action.rowId)) {
        return state;
      }
      const now = new Date().toISOString();
      const nextConversation = updateFeedRow(
        conversation,
        action.rowId,
        (row) => {
          const nextRow: ConversationFeedRow = {
            ...row,
            message: {
              ...row.message,
              content: action.content,
              timestamp: now,
            },
          };
          if (action.intent !== undefined) {
            if (nextRow.mirror) {
              nextRow.mirror = {
                ...nextRow.mirror,
                content: action.intent,
                timestamp: now,
              };
            } else if (row.message.role === "self") {
              nextRow.mirror = {
                type: "intent",
                content: action.intent,
                timestamp: now,
              };
            }
          } else if (nextRow.mirror) {
            nextRow.mirror = {
              ...nextRow.mirror,
              timestamp: now,
            };
          }
          return nextRow;
        }
      );
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "updateMirror": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      const targetRow = conversation.feed.find((row) => row.id === action.rowId);
      if (!targetRow) return state;
      const nextConversation = updateFeedRow(
        conversation,
        action.rowId,
        (row) => {
          const nextMirror: ConversationMirror = {
            type: row.mirror?.type ?? (row.message.role === "partner" ? "analysis" : "intent"),
            content: row.mirror?.content ?? "",
            timestamp: new Date().toISOString(),
            highlights: row.mirror?.highlights,
            status: row.mirror?.status ?? "idle",
            error: row.mirror?.error ?? null,
            ...action.mirror,
          };
          return {
            ...row,
            mirror: nextMirror,
          };
        }
      );
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversation.id]: nextConversation,
        },
      };
    }
    case "removeFeedRow": {
      const conversation = state.conversations[action.conversationId];
      if (!conversation) return state;
      if (!conversation.feed.some((row) => row.id === action.rowId)) {
        return state;
      }
      const filtered = conversation.feed.filter(
        (row) => row.id !== action.rowId
      );
      const nextConversation: Conversation = {
        ...conversation,
        feed: filtered,
        updatedAt: filtered[filtered.length - 1]?.message.timestamp ?? conversation.updatedAt,
      };
      return {
        ...state,
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
        if (!targetId) return undefined;
        const rowId = createFeedRowId(targetId);
        dispatch({
          type: "addPartnerMessage",
          conversationId: targetId,
          content,
          rowId,
        });
        return rowId;
      },
      addSelfMessage: (content: string, intent?: string) => {
        const targetId = state.activeId;
        if (!targetId) return undefined;
        const rowId = createFeedRowId(targetId);
        dispatch({
          type: "addSelfMessage",
          conversationId: targetId,
          content,
          intent,
          rowId,
        });
        return rowId;
      },
      addIntentDraft: (intent: string) => {
        const targetId = state.activeId;
        if (!targetId) return undefined;
        const rowId = createFeedRowId(targetId);
        dispatch({
          type: "addIntentDraft",
          conversationId: targetId,
          intent,
          rowId,
        });
        return rowId;
      },
      updateMessage: (rowId: string, content: string, options) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "updateMessage",
          conversationId: targetId,
          rowId,
          content,
          intent: options?.intent,
        });
      },
      updateMirror: (rowId: string, mirror) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "updateMirror",
          conversationId: targetId,
          rowId,
          mirror,
        });
      },
      removeFeedRow: (rowId: string) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "removeFeedRow",
          conversationId: targetId,
          rowId,
        });
      },
      setActiveConversation: (id: string) => dispatch({ type: "setActive", id }),
      togglePin: (id: string) => dispatch({ type: "togglePin", id }),
      toggleArchive: (id: string) => dispatch({ type: "toggleArchive", id }),
      deleteConversation: (id: string) => dispatch({ type: "delete", id }),
      setReplyLanguage: (replyLanguage: string) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "setReplyLanguage",
          conversationId: targetId,
          replyLanguage,
        });
      },
      setTonePreset: (tonePresetId: string) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "setTonePreset",
          conversationId: targetId,
          tonePresetId,
        });
      },
      setSelectedReferenceIds: (ids: string[]) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "setSelectedReferenceIds",
          conversationId: targetId,
          referenceIds: ids,
        });
      },
      setSelectedQuoteIds: (ids: string[]) => {
        const targetId = state.activeId;
        if (!targetId) return;
        dispatch({
          type: "setSelectedQuoteIds",
          conversationId: targetId,
          quoteIds: ids,
        });
      },
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
