import { buildTranslationPrompt, REPLY_PROMPT, TONE_PROMPTS, type ToneKey } from "@/prompts";

import type {
  PromptContextBlock,
  ReplyHistoryMessage,
  ReplyPromptPayload,
  TranslationPromptPayload,
  ConversationRole,
} from "./types";

const HISTORY_LIMIT = 6;
const DEFAULT_TONE_KEY: ToneKey = "concise";

export type ComposeHistorySource = Array<{
  role: ConversationRole;
  content: string;
  timestamp?: string;
}>;

export function composeTranslationPayload(
  message: string,
  options?: { targetLanguage?: string }
): TranslationPromptPayload {
  return buildTranslationPrompt(
    message,
    options?.targetLanguage ?? "中文"
  );
}

export function composeReplyPayload(options: {
  message: string;
  intent?: string | null;
  replyLanguage: string;
  toneKey?: ToneKey | null;
  context: PromptContextBlock;
  history: ComposeHistorySource;
}): ReplyPromptPayload {
  const toneKey = options.toneKey ?? DEFAULT_TONE_KEY;
  const tone = TONE_PROMPTS[toneKey] ?? TONE_PROMPTS[DEFAULT_TONE_KEY];

  return {
    task: "reply",
    system: REPLY_PROMPT.system,
    instruction: REPLY_PROMPT.instruction,
    tone: {
      id: toneKey,
      label: tone.label,
      prompt: tone.prompt,
    },
    replyLanguage: options.replyLanguage,
    intent: options.intent ?? (options.message.trim() ? options.message.trim() : null),
    context: options.context,
    history: sanitizeHistory(options.history),
  };
}

function sanitizeHistory(history: ComposeHistorySource): ReplyHistoryMessage[] {
  return history
    .filter((item) => item.content && item.content.trim().length > 0)
    .slice(-HISTORY_LIMIT)
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
      timestamp: item.timestamp,
    }));
}
