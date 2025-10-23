export type AiTaskType = "translate" | "reply";

export type ConversationRole = "partner" | "self";

export interface PromptContextBlock {
  references: string[];
  quotes: string[];
}

export interface TranslationPromptPayload {
  system: string;
  user: string;
}

export interface ReplyHistoryMessage {
  role: ConversationRole;
  content: string;
  timestamp?: string;
}

export interface ReplyToneBlock {
  id: string;
  label: string;
  prompt: string;
}

export interface ReplyPromptPayload {
  task: "reply";
  system: string;
  instruction: string;
  tone: ReplyToneBlock;
  replyLanguage: string;
  intent?: string | null;
  context: PromptContextBlock;
  history: ReplyHistoryMessage[];
}

export type PromptPayload = ReplyPromptPayload;

export interface AiClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  signal?: AbortSignal;
}

export type AiTaskRequest =
  | {
      task: "translate";
      payload: TranslationPromptPayload;
      config: AiClientConfig;
    }
  | {
      task: "reply";
      payload: ReplyPromptPayload;
      config: AiClientConfig;
    };

export interface AiTaskResponse {
  content: string;
  raw?: unknown;
}

export interface AiError {
  code:
    | "missing-config"
    | "network-error"
    | "timeout"
    | "unauthorized"
    | "bad-request"
    | "server-error"
    | "unknown";
  message: string;
  details?: unknown;
}

export class AiClientError extends Error {
  constructor(public readonly info: AiError) {
    super(info.message);
    this.name = "AiClientError";
  }
}
